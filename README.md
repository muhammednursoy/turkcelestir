# turkcelestir

macOS'ta İngilizce klavyeyle yazılmış, Türkçe karakterleri olmayan metni tek kısayolla
doğru hâline çevirir: metni seç, **⌥⇧T** (Option+Shift+T), metin yerinde değişir.

> `turkcelestir: pijamali hasta, yagiz sofore cabucak guvendi`
> → `türkçeleştir: pijamalı hasta, yağız şoföre çabucak güvendi`

Teams, Slack, tarayıcı, IDE, Notes: metin düzenlenebilen her uygulamada çalışır, çünkü
uygulamanın kendisine değil panoya ve ⌘C/⌘V tuşlarına dayanır.

*English: one-hotkey Turkish diacritics restoration for macOS (select text, press ⌥⇧T).
Built on Hammerspoon and [Deniz Yüret's deasciifier](https://github.com/emres/turkish-mode);
no Python or Node required.*

## Nasıl çalışır

1. ⌥⇧T'ye basınca [Hammerspoon](https://www.hammerspoon.org) seçili metni ⌘C ile kopyalar.
2. Metin, [Deniz Yüret](https://github.com/emres/turkish-mode)'in deasciify algoritmasının
   [JavaScript portundan](https://github.com/meacer/deasciifier) (`deasciify.js`) geçer.
   Dosya macOS'un yerleşik JavaScript for Automation motoruyla (`/usr/bin/osascript -l JavaScript`)
   çalışır; ek bir çalışma zamanı kurulmaz.
3. Sonuç ⌘V ile seçimin yerine yapıştırılır, 300 ms sonra eski pano içeriği geri yüklenir.

Dönüşüm yalnızca kısayola basıldığında olur; normal kopyala-yapıştır hiç etkilenmez.

## Gereksinimler

- macOS (Apple Silicon veya Intel). Yönetici hakkı gerekmez.
- Hammerspoon. Homebrew ile ya da GitHub'dan indirilen zip ile kurulabilir.
- Hammerspoon için bir kez Erişilebilirlik izni (tuş göndermek için).

## Kurulum

### Claude Code ile

Depoyu klonla, Claude Code'u depo dizininde aç ve [PROMPT.md](PROMPT.md) içeriğini yapıştır.
Prompt, kurulum adımlarını ve doğrulama komutlarını içerir; Claude kuruluma geçmeden önce
dönüştürücüyü tek başına test eder ve her adımda ne çalıştırdığını söyler.

### Elle

```bash
git clone https://github.com/muhammednursoy/turkcelestir.git
cd turkcelestir
```

Dönüştürücüyü hiçbir şey kurmadan dene:

```bash
printf 'uc gun sonra gorusuruz' > /tmp/deasciify-test.txt
LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript deasciify.js /tmp/deasciify-test.txt
```

Beklenen çıktı: `üç gün sonra görüşürüz`.

Hammerspoon'u kur (Homebrew ile):

```bash
brew install --cask hammerspoon
```

Homebrew yoksa [Hammerspoon sürümler](https://github.com/Hammerspoon/hammerspoon/releases/latest)
sayfasından zip'i indir, `Hammerspoon.app`'i `~/Applications/` altına koy.

Yapılandırmayı yerleştir ve Hammerspoon'u aç:

```bash
mkdir -p ~/.hammerspoon
cp init.lua deasciify.js ~/.hammerspoon/
open -a Hammerspoon
```

Sistem Ayarları > Gizlilik ve Güvenlik > Erişilebilirlik bölümünde Hammerspoon'u etkinleştir,
sonra Hammerspoon'u yeniden başlat (izin açılışta okunur):

```bash
killall Hammerspoon; open -a Hammerspoon
```

Hammerspoon menü çubuğundan Console'u aç; `hs.accessibilityState()` `true` dönmeli.
Bir metin alanında Türkçe karakter kullanmadan bir cümle yaz, seç, ⌥⇧T.

Zaten bir `~/.hammerspoon/init.lua` dosyan varsa `init.lua` içeriğini onun sonuna ekle;
`deasciify.js` yine `~/.hammerspoon/` altında durmalı.

## Kısayolu değiştirmek

`init.lua` içindeki satır:

```lua
hs.hotkey.bind({"alt", "shift"}, "T", turkceDuzelt)
```

Değiştirdikten sonra Hammerspoon menüsünden "Reload Config".

## Hammerspoon kurulamıyorsa (kurumsal Mac)

Gatekeeper ya da MDM Hammerspoon'un açılmasına ya da Erişilebilirlik iznine izin vermiyorsa
üçüncü parti uygulama gerektirmeyen yol: macOS Kısayollar uygulamasında bir Hızlı Eylem.

"Panoyu Al" → "Kabuk Betiği Çalıştır" → "Panoya Kopyala" adımlarıyla bir kısayol kur ve ona
⌥⇧T ata. Kabuk betiği, stdin'den gelen metni geçici bir dosyaya yazıp
`LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ~/.hammerspoon/deasciify.js <dosya>`
çalıştırır. Kısayollar > Ayarlar > Gelişmiş > "Betiklerin Çalıştırılmasına İzin Ver" açık
olmalı. Kullanım: metni seç, ⌘C, ⌥⇧T, ⌘V. Yalnızca panoya dokunduğu için yine her uygulamada
çalışır; bedeli iki tuş fazlası.

## Sınırlar

- Algoritma yazım hatası düzeltmez; hatalı yazılmış kelimeye yanlış Türkçe karakter ekleyebilir.
- Şapkalı ayrımları (kar/kâr, hala/hâlâ) yapmaz, cümle başını büyük harfe çevirmez.
- Metin içindeki İngilizce kelimelere ve koda genelde dokunmaz, ama garanti değil;
  kod bloklarını seçime katmamak en güvenlisi.
- Zengin metin seçimi düz metin olarak yapıştırılır, biçim kaybolur.
- Seçim yoksa "Seçili metin yok" uyarısı çıkar, hiçbir şey değişmez.

## Teşekkür ve lisans

- Algoritma: [Deniz Yüret, turkish-mode for Emacs](https://github.com/emres/turkish-mode) (MIT).
- JavaScript portu: [Mustafa Emre Acer, deasciifier](https://github.com/meacer/deasciifier) (MIT).
  `deasciify.js` bu portun 1.1 sürümü artı dosyadan okuyan bir `run(argv)` giriş noktasıdır.
- Bu depo: MIT, bkz. [LICENSE](LICENSE).
