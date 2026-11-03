local script = hs.configdir .. "/deasciify.js"

local function shellQuote(s)
  return "'" .. s:gsub("'", "'\\''") .. "'"
end

local function convert(text)
  local tmp = hs.fs.temporaryDirectory() .. "turkcelestir-" .. hs.host.uuid() .. ".txt"
  local f = io.open(tmp, "w")
  if not f then return nil end
  f:write(text)
  f:close()
  local out, ok = hs.execute("LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript " .. shellQuote(script) .. " " .. shellQuote(tmp))
  os.remove(tmp)
  if not ok then return nil end
  -- osascript appends one newline to the returned string.
  if out:sub(-1) == "\n" then
    out = out:sub(1, -2)
  end
  if out == "" and text ~= "" then return nil end
  return out
end

local function savePasteboard()
  local ok, data = pcall(hs.pasteboard.readAllData)
  if ok and type(data) == "table" and next(data) then return data end
  local text = hs.pasteboard.getContents()
  if text then return { text = text } end
  return nil
end

local function restorePasteboard(saved)
  if not saved then return end
  if saved.text then
    hs.pasteboard.setContents(saved.text)
    return
  end
  local ok = pcall(hs.pasteboard.writeAllData, saved)
  if not ok then hs.pasteboard.clearContents() end
end

local saved = nil
local restoreTimer = nil

local function scheduleRestore(delay)
  restoreTimer = hs.timer.doAfter(delay, function()
    restoreTimer = nil
    restorePasteboard(saved)
    saved = nil
  end)
end

local function finish()
  local text = hs.pasteboard.getContents()
  if not text or text == "" then
    hs.alert.show("Seçili metin yok")
    scheduleRestore(0)
    return
  end
  local out = convert(text)
  if not out then
    hs.alert.show("Dönüştürücü çalışmadı, pano geri yüklendi")
    scheduleRestore(0)
    return
  end
  hs.pasteboard.setContents(out)
  hs.eventtap.keyStroke({"cmd"}, "v", 0)
  scheduleRestore(0.5)
end

function turkceDuzelt()
  if restoreTimer then
    -- A second press before the previous restore fired: keep the original pasteboard, not the converted text.
    restoreTimer:stop()
    restoreTimer = nil
  else
    saved = savePasteboard()
  end

  local before = hs.pasteboard.changeCount()
  hs.eventtap.keyStroke({"cmd"}, "c", 0)

  local tries = 0
  local function poll()
    if hs.pasteboard.changeCount() ~= before then
      finish()
    elseif tries < 25 then
      tries = tries + 1
      hs.timer.doAfter(0.02, poll)
    else
      hs.alert.show("Seçili metin yok")
      scheduleRestore(0.5)
    end
  end
  poll()
end

hs.hotkey.bind({"alt", "shift"}, "T", turkceDuzelt)

hs.alert.show("turkcelestir hazır: ⌥⇧T")
