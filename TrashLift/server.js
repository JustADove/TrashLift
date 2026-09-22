/**
 * TrashLift live sync server — shared requests + worker GPS for all devices.
 * Serves main.html and /api/* endpoints. Zero npm deps (Node only).
 */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");

var PORT = Number(process.env.PORT) || 8080;
var ROOT = __dirname;
var DATA_FILE = path.join(ROOT, "data", "state.json");

var state = {
  requests: [],
  locations: {}, // requestId -> { lat, lng, updatedAt, workerName }
  messages: {}   // requestId -> [ { id, sender, senderName, text, photoUrl, isPickupPhoto, createdAt } ]
};

function loadState(){
  try{
    if (fs.existsSync(DATA_FILE)){
      var raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      state.requests = Array.isArray(raw.requests) ? raw.requests : [];
      state.locations = raw.locations && typeof raw.locations === "object" ? raw.locations : {};
      state.messages = raw.messages && typeof raw.messages === "object" ? raw.messages : {};
    }
  }catch(e){
    console.warn("Could not load state:", e.message);
  }
}

function saveState(){
  try{
    var dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  }catch(e){
    console.warn("Could not save state:", e.message);
  }
}

function sendJson(res, code, obj){
  var body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

var MAX_BODY = 6 * 1024 * 1024;
var PHOTO_DIR = path.join(ROOT, "data", "photos");
var CHAT_PHOTO_DIR = path.join(ROOT, "data", "chat-photos");

function safePhotoId(id){
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function photoPath(id){
  return path.join(PHOTO_DIR, safePhotoId(id) + ".jpg");
}

function chatPhotoPath(id){
  return path.join(CHAT_PHOTO_DIR, safePhotoId(id) + ".jpg");
}

function saveJpegDataUrl(dir, id, dataUrl){
  var sid = safePhotoId(id);
  if (!sid) throw new Error("Invalid photo id");
  var m = String(dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error("Need a camera JPEG");
  var buf = Buffer.from(m[1], "base64");
  if (!buf.length || buf.length > 2.5 * 1024 * 1024) throw new Error("Photo too large");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, sid + ".jpg"), buf);
  return sid;
}

function savePhotoFromDataUrl(id, dataUrl){
  var sid = saveJpegDataUrl(PHOTO_DIR, id, dataUrl);
  return "/photos/" + sid + ".jpg";
}

function saveChatPhotoFromDataUrl(id, dataUrl){
  var sid = saveJpegDataUrl(CHAT_PHOTO_DIR, id, dataUrl);
  return "/chat-photos/" + sid + ".jpg";
}

function deleteMessagesFor(requestId){
  var list = state.messages[requestId];
  if (Array.isArray(list)){
    list.forEach(function(m){
      if (m && m.photoUrl){
        try{
          var p = chatPhotoPath(m.id);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }catch(e){}
      }
    });
  }
  delete state.messages[requestId];
}

function readBody(req){
  return new Promise(function(resolve, reject){
    var chunks = [];
    var size = 0;
    req.on("data", function(c){
      size += c.length;
      if (size > MAX_BODY){
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", function(){
      var raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try{ resolve(JSON.parse(raw)); }
      catch(e){ reject(e); }
    });
    req.on("error", reject);
  });
}

function mimeFor(filePath){
  var ext = path.extname(filePath).toLowerCase();
  return ({
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  })[ext] || "application/octet-stream";
}

function serveStatic(req, res, pathname){
  var rel = pathname === "/" ? "/main.html" : pathname;
  var filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)){
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(filePath, function(err, data){
    if (err){
      res.writeHead(404); res.end("Not found"); return;
    }
    res.writeHead(200, { "Content-Type": mimeFor(filePath) });
    res.end(data);
  });
}

async function handleApi(req, res, pathname){
  if (req.method === "OPTIONS"){
    sendJson(res, 204, {});
    return;
  }

  if (pathname === "/api/state" && req.method === "GET"){
    var messageCounts = {};
    Object.keys(state.messages).forEach(function(k){
      messageCounts[k] = (state.messages[k] || []).length;
    });
    sendJson(res, 200, {
      requests: state.requests,
      locations: state.locations,
      messageCounts: messageCounts,
      serverTime: Date.now()
    });
    return;
  }

  if (pathname === "/api/requests" && req.method === "POST"){
    var body = await readBody(req);
    if (!body || !body.id){
      sendJson(res, 400, { error: "Missing request id" });
      return;
    }
    var exists = state.requests.some(function(r){ return r.id === body.id; });
    if (!exists){
      delete body.photoData;
      if (!body.photoUrl && fs.existsSync(photoPath(body.id))){
        body.photoUrl = "/photos/" + safePhotoId(body.id) + ".jpg";
      }
      state.requests.unshift(body);
      saveState();
    }
    sendJson(res, 200, { ok: true, requests: state.requests, locations: state.locations });
    return;
  }

  if (pathname === "/api/requests" && req.method === "DELETE"){
    state.requests.forEach(function(r){
      try{
        var p = photoPath(r.id);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }catch(e){}
      deleteMessagesFor(r.id);
    });
    state.requests = [];
    state.locations = {};
    state.messages = {};
    saveState();
    sendJson(res, 200, { ok: true, requests: state.requests, locations: state.locations });
    return;
  }

  var patchMatch = pathname.match(/^\/api\/requests\/([^/]+)$/);
  if (patchMatch && req.method === "DELETE"){
    var delId = decodeURIComponent(patchMatch[1]);
    var before = state.requests.length;
    state.requests = state.requests.filter(function(r){ return r.id !== delId; });
    delete state.locations[delId];
    if (state.requests.length === before){
      sendJson(res, 404, { error: "Request not found" });
      return;
    }
    try{
      var delPhoto = photoPath(delId);
      if (fs.existsSync(delPhoto)) fs.unlinkSync(delPhoto);
    }catch(e){}
    deleteMessagesFor(delId);
    saveState();
    sendJson(res, 200, { ok: true, requests: state.requests, locations: state.locations });
    return;
  }

  if (patchMatch && req.method === "PATCH"){
    var id = decodeURIComponent(patchMatch[1]);
    var patch = await readBody(req);
    var reqItem = state.requests.filter(function(r){ return r.id === id; })[0];
    if (!reqItem){
      sendJson(res, 404, { error: "Request not found" });
      return;
    }
    if (patch.status) reqItem.status = patch.status;
    if (patch.collector != null) reqItem.collector = patch.collector;
    if (patch.status === "done"){
      delete state.locations[id];
    }
    saveState();
    sendJson(res, 200, { ok: true, request: reqItem, requests: state.requests, locations: state.locations });
    return;
  }

  if (pathname === "/api/photos" && req.method === "POST"){
    var photoBody = await readBody(req);
    if (!photoBody.id || !photoBody.dataUrl){
      sendJson(res, 400, { error: "Need id and camera photo" });
      return;
    }
    var photoUrl = savePhotoFromDataUrl(photoBody.id, photoBody.dataUrl);
    var existing = state.requests.filter(function(r){ return r.id === photoBody.id; })[0];
    if (existing){
      existing.photoUrl = photoUrl;
      saveState();
    }
    sendJson(res, 200, { ok: true, photoUrl: photoUrl });
    return;
  }

  var msgListMatch = pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (msgListMatch && req.method === "GET"){
    var mrid = decodeURIComponent(msgListMatch[1]);
    sendJson(res, 200, { messages: state.messages[mrid] || [] });
    return;
  }

  if (pathname === "/api/messages" && req.method === "POST"){
    var msgBody = await readBody(req);
    if (!msgBody || !msgBody.id || !msgBody.requestId || !msgBody.sender){
      sendJson(res, 400, { error: "Missing message fields" });
      return;
    }
    var list = state.messages[msgBody.requestId];
    if (!list){ list = []; state.messages[msgBody.requestId] = list; }
    var msgExists = list.some(function(m){ return m.id === msgBody.id; });
    if (!msgExists){
      var sender = msgBody.sender === "worker" ? "worker" : "resident";
      var msg = {
        id: String(msgBody.id),
        sender: sender,
        senderName: msgBody.senderName || null,
        text: typeof msgBody.text === "string" ? msgBody.text.slice(0, 2000) : "",
        photoUrl: msgBody.photoUrl || null,
        isPickupPhoto: !!msgBody.isPickupPhoto,
        createdAt: Date.now()
      };
      list.push(msg);
      if (msg.isPickupPhoto && msg.sender === "worker"){
        var linkedReq = state.requests.filter(function(r){ return r.id === msgBody.requestId; })[0];
        if (linkedReq) linkedReq.driverPhotoConfirmed = true;
      }
      saveState();
    }
    sendJson(res, 200, {
      ok: true,
      messages: state.messages[msgBody.requestId],
      requests: state.requests,
      locations: state.locations
    });
    return;
  }

  if (pathname === "/api/chat-photos" && req.method === "POST"){
    var cphotoBody = await readBody(req);
    if (!cphotoBody.id || !cphotoBody.dataUrl){
      sendJson(res, 400, { error: "Need id and camera photo" });
      return;
    }
    var cPhotoUrl = saveChatPhotoFromDataUrl(cphotoBody.id, cphotoBody.dataUrl);
    sendJson(res, 200, { ok: true, photoUrl: cPhotoUrl });
    return;
  }

  if (pathname === "/api/location" && req.method === "POST"){
    var loc = await readBody(req);
    if (!loc.requestId || typeof loc.lat !== "number" || typeof loc.lng !== "number"){
      sendJson(res, 400, { error: "Need requestId, lat, lng" });
      return;
    }
    state.locations[loc.requestId] = {
      lat: loc.lat,
      lng: loc.lng,
      updatedAt: Date.now(),
      workerName: loc.workerName || null
    };
    saveState();
    sendJson(res, 200, { ok: true, locations: state.locations });
    return;
  }

  sendJson(res, 404, { error: "Unknown API route" });
}

loadState();

var server = http.createServer(function(req, res){
  var parsed = url.parse(req.url, true);
  var pathname = parsed.pathname || "/";

  if (pathname.indexOf("/api/") === 0){
    handleApi(req, res, pathname).catch(function(err){
      console.error(err);
      sendJson(res, 500, { error: String(err.message || err) });
    });
    return;
  }

  var photoMatch = pathname.match(/^\/photos\/([a-zA-Z0-9_-]+)\.jpg$/);
  if (photoMatch){
    var file = photoPath(photoMatch[1]);
    fs.readFile(file, function(err, data){
      if (err){ res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
      res.end(data);
    });
    return;
  }

  var chatPhotoMatch = pathname.match(/^\/chat-photos\/([a-zA-Z0-9_-]+)\.jpg$/);
  if (chatPhotoMatch){
    var cfile = chatPhotoPath(chatPhotoMatch[1]);
    fs.readFile(cfile, function(err, data){
      if (err){ res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
      res.end(data);
    });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, "0.0.0.0", function(){
  console.log("TrashLift live sync on http://0.0.0.0:" + PORT);
  console.log("Open http://localhost:" + PORT + "/main.html");
});
