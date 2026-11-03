# Claude Code için kurulum prompt'u

Aşağıdaki metni, depoyu klonladığın dizinde açtığın Claude Code oturumuna olduğu gibi yapıştır.

---

Bu Mac'te İngilizce klavye düzeniyle yazıyorum, Türkçe karakterler (ı ğ ü ş ö ç İ) çıkmıyor.
İstediğim: herhangi bir uygulamada metni seçip **Option+Shift+T**'ye bastığımda metnin doğru
Türkçe karakterli hâlinin yerine yapıştırılması. Bu dizin
(https://github.com/muhammednursoy/turkcelestir klonu) bunun için gereken dosyaları içeriyor;
README.md'yi oku.

## Dosyalar

- `init.lua`: Hammerspoon yapılandırması. ⌥⇧T'ye basınca ⌘C gönderir, panodaki metni
  dönüştürür, ⌘V ile yapıştırır, 300 ms sonra eski pano içeriğini geri koyar.
- `deasciify.js`: [Deniz Yüret](https://github.com/emres/turkish-mode)'in deasciify algoritmasının
  [JavaScript portu](https://github.com/meacer/deasciifier) + `run(argv)` giriş noktası. macOS'un yerleşik JavaScript for Automation motoruyla
  (`/usr/bin/osascript -l JavaScript`) çalışır; **Python, Node, Homebrew gerekmez.**

Dosyaları değiştirme, yalnızca kopyala.

## Yapılacaklar, sırayla

1. **Dönüştürücüyü tek başına doğrula** (hiçbir şey kurmadan):
   ```bash
   printf 'ingilizce klavye kullaniyorum, uc gun sonra gorusuruz' > /tmp/deasciify-test.txt
   LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ./deasciify.js /tmp/deasciify-test.txt
   ```
   Beklenen çıktı: `ingilizce klavye kullanıyorum, üç gün sonra görüşürüz`. Çıkmazsa dur ve söyle.

2. **Hammerspoon'u kur.** Homebrew varsa `brew install --cask hammerspoon`. Yoksa yönetici
   hakkı gerektirmeyen yol: https://github.com/Hammerspoon/hammerspoon/releases/latest
   adresinden `Hammerspoon-<sürüm>.zip` indir, aç, `Hammerspoon.app`'i `~/Applications/`
   altına koy (dizin yoksa oluştur). Gatekeeper ya da MDM açılmasına izin vermezse 6. adıma geç.

3. **Yapılandırmayı yerleştir.** `~/.hammerspoon/init.lua` zaten varsa üzerine yazma; içeriği
   sonuna ekle ve bana söyle.
   ```bash
   mkdir -p ~/.hammerspoon
   cp init.lua deasciify.js ~/.hammerspoon/
   ```

4. **Hammerspoon'u aç ve Erişilebilirlik izni ver.** `open -a Hammerspoon` ile aç. Sistem
   Ayarları'nın ilgili bölümünü şu komutla aç ve Hammerspoon'u etkinleştirmemi iste:
   ```bash
   open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
   ```
   İzin verildikten sonra Hammerspoon'u **yeniden başlat** (`killall Hammerspoon; open -a Hammerspoon`);
   izin açılışta okunur, yeniden başlatmadan `false` kalır. Doğrulama: Hammerspoon menü çubuğu
   simgesi > Console'da `hs.accessibilityState()` `true` dönmeli. `hs` komut satırı aracı varsa
   (Homebrew kurulumunda `/opt/homebrew/bin/hs`) `hs -c 'print(hs.accessibilityState())'`.
   Erişilebilirlik izni MDM tarafından kilitliyse 6. adıma geç.

5. **Uçtan uca test** (TextEdit ile, `hs` aracı varsa):
   ```bash
   printf 'PANO-ISARETI' | pbcopy
   osascript -e 'tell application "TextEdit"' -e 'activate' -e 'set d to make new document' -e 'set text of d to "ingilizce klavye kullaniyorum, uc gun sonra gorusuruz"' -e 'end tell'
   sleep 1.5
   hs -t 15 -c 'hs.eventtap.keyStroke({"cmd"}, "a", 0); hs.timer.usleep(200000); turkceDuzelt()'
   sleep 1.5
   osascript -e 'tell application "TextEdit" to get text of document 1'
   pbpaste
   osascript -e 'tell application "TextEdit" to close document 1 saving no'
   ```
   Beklenen: belge metni Türkçe karakterli hâle gelir, `pbpaste` `PANO-ISARETI` döner (pano geri
   yüklenmiş). `hs` aracı yoksa testi ben yaparım: TextEdit'te metni seçip ⌥⇧T'ye basarım.

6. **Yedek yol, yalnızca Hammerspoon açılamıyor ya da Erişilebilirlik izni verilemiyorsa:**
   macOS Kısayollar uygulamasında bir Hızlı Eylem kur: "Panoyu Al" → "Kabuk Betiği Çalıştır"
   (girdi stdin; betik stdin'i geçici bir dosyaya yazıp
   `LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ~/.hammerspoon/deasciify.js <dosya>`
   çalıştırır) → "Panoya Kopyala". Kısayola ⌥⇧T ata. Kısayollar > Ayarlar > Gelişmiş >
   "Betiklerin Çalıştırılmasına İzin Ver" açık olmalı. Kullanım: metni seç, ⌘C, ⌥⇧T, ⌘V.

## Kurallar

- Python, Node, uv, pip kurma; dönüştürücü yerleşik osascript ile çalışıyor.
- Hammerspoon ve `~/.hammerspoon/` dışında sistem ayarı değiştirme.
- Her adımda ne çalıştırdığını ve çıktısını söyle; doğrulamadığın bir şeyi çalışıyor diye yazma.
- Bir adım kurumsal kısıt yüzünden takılırsa (Gatekeeper, MDM, izin) hangi adım ve hangi hata
  olduğunu söyleyip 6. adıma geç, kısıtı aşmaya çalışma.
