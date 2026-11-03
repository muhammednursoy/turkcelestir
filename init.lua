require("hs.ipc")
hs.autoLaunch(true)

local script = os.getenv("HOME") .. "/.hammerspoon/deasciify.js"

local function shellQuote(s)
  return "'" .. s:gsub("'", "'\\''") .. "'"
end

local function convert(text)
  local tmp = hs.fs.temporaryDirectory() .. "deasciify-" .. hs.host.uuid() .. ".txt"
  local f = io.open(tmp, "w")
  f:write(text)
  f:close()
  local out, ok = hs.execute("LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript " .. shellQuote(script) .. " " .. shellQuote(tmp))
  os.remove(tmp)
  if not ok then return nil end
  -- osascript appends one newline to the returned string.
  if out:sub(-1) == "\n" then
    out = out:sub(1, -2)
  end
  return out
end

function turkceDuzelt()
  local old = hs.pasteboard.getContents()
  local before = hs.pasteboard.changeCount()
  hs.eventtap.keyStroke({"cmd"}, "c", 0)

  -- Cmd+C lands asynchronously; reading the pasteboard before changeCount moves returns the previous clipboard.
  local waited = 0
  while hs.pasteboard.changeCount() == before and waited < 500 do
    hs.timer.usleep(20000)
    waited = waited + 20
  end
  if hs.pasteboard.changeCount() == before then
    hs.alert.show("Seçili metin yok")
    return
  end

  local text = hs.pasteboard.getContents()
  if not text or text == "" then
    hs.alert.show("Seçili metin yok")
    return
  end

  local out = convert(text)
  if not out then
    hs.alert.show("deasciify.js çalışmadı")
    hs.pasteboard.setContents(old or "")
    return
  end

  hs.pasteboard.setContents(out)
  hs.eventtap.keyStroke({"cmd"}, "v", 0)
  hs.timer.doAfter(0.3, function()
    if old then hs.pasteboard.setContents(old) end
  end)
end

hs.hotkey.bind({"alt", "shift"}, "T", turkceDuzelt)

hs.alert.show("Hammerspoon hazır: ⌥⇧T Türkçeleştir")
