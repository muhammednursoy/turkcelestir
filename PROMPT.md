# Claude Code için kurulum prompt'u

Aşağıdaki metni, depoyu klonladığın dizinde açtığın Claude Code oturumuna olduğu gibi yapıştır.

---

Bu Mac'te İngilizce klavye düzeniyle yazıyorum, Türkçe karakterler (ı ğ ü ş ö ç İ) çıkmıyor.
İstediğim: herhangi bir uygulamada metni seçip **Option+Shift+T**'ye bastığımda metnin doğru
Türkçe karakterli hâlinin yerine yapıştırılması. Bu dizin
(https://github.com/muhammednursoy/turkcelestir klonu) bunun için gereken dosyaları içeriyor;
README.md'yi oku.

## Dosyalar

- `init.lua`: Hammerspoon yapılandırması. ⌥⇧T'ye basınca panoyu saklar, ⌘C gönderir, panodaki
  metni dönüştürür, ⌘V ile yapıştırır, yarım saniye sonra saklanan panoyu geri koyar.
- `turkcelestir.js`: giriş noktası, bağlantı/kod koruması ve kişisel sözlük katmanı; yanındaki
  `vendor/deasciifier/deasciifier.js` dosyasını yükler.
- `vendor/deasciifier/`: [Deniz Yüret](https://github.com/emres/turkish-mode)'in deasciify
  algoritmasının [JavaScript portu](https://github.com/meacer/deasciifier), değiştirilmemiş üçüncü
  taraf kod, kendi LICENSE ve README'siyle. Hepsi macOS'un yerleşik JavaScript for Automation
  motoruyla (`/usr/bin/osascript -l JavaScript`) çalışır; **Python, Node, Homebrew gerekmez.**
- `turkcelestir-sozluk.ornek.json`: isteğe bağlı kişisel sözlük örneği.

Dosyaları değiştirme, yalnızca kopyala.

## Yapılacaklar, sırayla

1. **Dönüştürücüyü tek başına doğrula** (hiçbir şey kurmadan):
   ```bash
   T=$(mktemp); printf 'ingilizce klavye kullaniyorum, uc gun sonra gorusuruz' > "$T"
   LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ./turkcelestir.js "$T"; rm -f "$T"
   ```
   Beklenen çıktı: `ingilizce klavye kullanıyorum, üç gün sonra görüşürüz`. Çıkmazsa dur ve söyle.

2. **Hammerspoon'u kur.** Homebrew varsa `brew install --cask hammerspoon` (yönetici kullanıcı
   ister). Yoksa ya da yönetici değilsem: https://github.com/Hammerspoon/hammerspoon/releases/latest
   adresinden `Hammerspoon-<sürüm>.zip` indir, aç, `Hammerspoon.app`'i `~/Applications/`
   altına koy (dizin yoksa oluştur). Gatekeeper ya da MDM açılmasına izin vermezse 6. adıma geç.

3. **Yapılandırmayı yerleştir.** Mevcut bir `~/.hammerspoon/init.lua` varsa üzerine yazma,
   sonuna ekle ve bana söyle:
   ```bash
   mkdir -p ~/.hammerspoon && cp -R turkcelestir.js vendor ~/.hammerspoon/
   [ -e ~/.hammerspoon/init.lua ] && cat init.lua >> ~/.hammerspoon/init.lua || cp init.lua ~/.hammerspoon/
   ```

4. **Hammerspoon'u aç ve Erişilebilirlik izni ver.** `open -a Hammerspoon` ile aç. Sistem
   Ayarları'nın ilgili bölümünü şu komutla aç ve Hammerspoon'u etkinleştirmemi iste:
   ```bash
   open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
   ```
   İzin verildikten sonra Hammerspoon'u **yeniden başlat** (`killall Hammerspoon; open -a Hammerspoon`);
   izin açılışta okunur, yeniden başlatmadan `false` kalır. Doğrulama: Hammerspoon menü çubuğu
   simgesi > Console'da `hs.accessibilityState()` `true` dönmeli.
   Erişilebilirlik izni MDM tarafından kilitliyse 6. adıma geç.
   Girişte otomatik başlatmayı açmak istersem Hammerspoon tercihlerinden kendim açarım; sen açma.

5. **Uçtan uca test.** Elle: TextEdit'te Türkçe karaktersiz bir cümle yaz, seç, ⌥⇧T; cümle
   düzelmeli, ardından ⌘V ile yapıştırınca eski pano içeriği gelmeli. Bunu ben yaparım.
   Otomatik test istersem: `~/.hammerspoon/init.lua` başına geçici olarak `require("hs.ipc")`
   satırı ekle, Hammerspoon'da "Reload Config", sonra (`hs` aracı Homebrew kurulumunda
   `/opt/homebrew/bin/hs`):
   ```bash
   OLD=$(pbpaste); printf 'PANO-ISARETI' | pbcopy
   osascript -e 'tell application "TextEdit"' -e 'activate' -e 'set d to make new document' -e 'set text of d to "ingilizce klavye kullaniyorum, uc gun sonra gorusuruz"' -e 'end tell'
   sleep 1.5
   hs -t 15 -c 'local a = hs.application.frontmostApplication(); if a:name() ~= "TextEdit" then error("önde TextEdit yok: " .. a:name()) end; hs.eventtap.keyStroke({"cmd"}, "a", 0); hs.timer.usleep(200000); turkceDuzelt()'
   sleep 1.5
   osascript -e 'tell application "TextEdit" to get text of document 1'
   pbpaste
   osascript -e 'tell application "TextEdit" to close document 1 saving no'
   printf '%s' "$OLD" | pbcopy
   ```
   Beklenen: belge metni Türkçe karakterli hâle gelir, `pbpaste` `PANO-ISARETI` döner. Test
   bitince `require("hs.ipc")` satırını kaldır ve "Reload Config" yap; o satır aynı
   kullanıcıdaki her sürece Hammerspoon içinde kod çalıştırma kapısı açar, kalıcı olmamalı.

6. **Yedek yol, yalnızca Hammerspoon açılamıyor ya da Erişilebilirlik izni verilemiyorsa:**
   kurumsal cihazda önce BT politikasını kontrol etmemi hatırlat; betik çalıştırma izni de
   politikaya aykırı olabilir. macOS Kısayollar uygulamasında bir Hızlı Eylem kur: "Panoyu Al" →
   "Kabuk Betiği Çalıştır" (girdi stdin; betik stdin'i geçici bir dosyaya yazıp
   `LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ~/.hammerspoon/turkcelestir.js <dosya>`
   çalıştırır) → "Panoya Kopyala". Kısayola ⌥⇧T ata. Kısayollar > Ayarlar > Gelişmiş >
   "Betiklerin Çalıştırılmasına İzin Ver" açık olmalı. Kullanım: metni seç, ⌘C, ⌥⇧T, ⌘V.
   Bu yol tarif edilmiş, depoda uçtan uca test edilmemiştir; çalıştığını birlikte doğrularız.

## Kurallar

- Python, Node, uv, pip kurma; dönüştürücü yerleşik osascript ile çalışıyor.
- Hammerspoon ve `~/.hammerspoon/` dışında sistem ayarı değiştirme; girişte başlatma dahil.
- Her adımda ne çalıştırdığını ve çıktısını söyle; doğrulamadığın bir şeyi çalışıyor diye yazma.
- Bir adım kurumsal kısıt yüzünden takılırsa (Gatekeeper, MDM, izin) hangi adım ve hangi hata
  olduğunu söyleyip 6. adıma geç, kısıtı aşmaya çalışma.
