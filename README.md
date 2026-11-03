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

1. ⌥⇧T'ye basınca [Hammerspoon](https://www.hammerspoon.org) panonun o anki içeriğini saklar
   ve seçili metni ⌘C ile kopyalar.
2. Metin, [Deniz Yüret](https://github.com/emres/turkish-mode)'in deasciify algoritmasının
   [JavaScript portundan](https://github.com/meacer/deasciifier) (`deasciify.js`) geçer.
   Dosya macOS'un yerleşik JavaScript for Automation motoruyla (`/usr/bin/osascript -l JavaScript`)
   çalışır; ek bir çalışma zamanı kurulmaz.
3. Sonuç ⌘V ile seçimin yerine yapıştırılır, yarım saniye sonra saklanan pano içeriği
   (metin, görüntü ya da dosya, ne varsa) geri yüklenir.

Dönüşüm yalnızca kısayola basıldığında olur; normal kopyala-yapıştır hiç etkilenmez.

### Dokunulmayan parçalar

Şunlar dönüşümden önce işaretlenir ve olduğu gibi bırakılır: bağlantılar (`https://…`, `www.…`),
e-posta adresleri, dosya yolları (`/usr/bin`, `~/Belgeler`, `./x`), ters tırnak içindeki kod,
içinde rakam ya da alt çizgi geçen kelimeler (`user_id`, `v2`), camelCase tanımlayıcılar
(`isActive`), `@kullanıcı` ve `#etiket`. Böylece `ali.cicek@sirket.com` ya da `userId`
"çiçek" ve "userİd" olmaz.

### Kişisel sözlük

Algoritmanın kaçırdığı kelimeleri `~/.hammerspoon/turkcelestir-sozluk.json` dosyasına yazarsan
her dönüşümde uygulanır. Biçim düz bir nesne, anahtar İngilizce klavyeyle yazdığın hâl, değer
istediğin karşılık; büyük harfle başlayan kelimede karşılık da büyük harfle başlar:

```json
{
  "turkcelestir": "türkçeleştir",
  "ingilizce": "İngilizce",
  "istanbul": "İstanbul"
}
```

Örnek dosya depoda: `turkcelestir-sozluk.ornek.json`. Dosya yoksa bu adım atlanır; dosya bozuksa
dönüşüm hata verir ve pano geri yüklenir.

## Gereksinimler

- macOS (Apple Silicon veya Intel).
- Hammerspoon. Homebrew ile kurulum Homebrew'un kendisi gibi yönetici kullanıcı ister; GitHub'dan
  indirilen zip `~/Applications` altına konursa yönetici hakkı gerekmez.
- Hammerspoon için bir kez Erişilebilirlik izni. Bu izin Hammerspoon'a tüm uygulamalarda tuş
  gönderme ve okuma, pencere içeriğine erişme yetkisi verir; `init.lua`'daki her satır bu yetkiyle
  çalışır. Dosya kısa, kurmadan önce okumanı öneririz.

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
T=$(mktemp); printf 'uc gun sonra gorusuruz' > "$T"
LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript deasciify.js "$T"; rm -f "$T"
```

Beklenen çıktı: `üç gün sonra görüşürüz`.

Hammerspoon'u kur (Homebrew ile):

```bash
brew install --cask hammerspoon
```

Homebrew yoksa [Hammerspoon sürümler](https://github.com/Hammerspoon/hammerspoon/releases/latest)
sayfasından zip'i indir, `Hammerspoon.app`'i `~/Applications/` altına koy.

Yapılandırmayı yerleştir. Zaten bir `~/.hammerspoon/init.lua` dosyan varsa ikinci komut
üzerine yazmaz, sonuna ekler:

```bash
mkdir -p ~/.hammerspoon && cp deasciify.js ~/.hammerspoon/
```

```bash
[ -e ~/.hammerspoon/init.lua ] && cat init.lua >> ~/.hammerspoon/init.lua || cp init.lua ~/.hammerspoon/
```

Hammerspoon'u aç:

```bash
open -a Hammerspoon
```

Sistem Ayarları > Gizlilik ve Güvenlik > Erişilebilirlik bölümünde Hammerspoon'u etkinleştir,
sonra Hammerspoon'u yeniden başlat (izin açılışta okunur):

```bash
killall Hammerspoon; open -a Hammerspoon
```

Hammerspoon menü çubuğundan Console'u aç; `hs.accessibilityState()` `true` dönmeli.
Bir metin alanında Türkçe karakter kullanmadan bir cümle yaz, seç, ⌥⇧T.

Girişte otomatik başlamasını istiyorsan Hammerspoon tercihlerinde "Launch Hammerspoon at login"
seçeneğini aç; `init.lua` bu ayarı kendi başına değiştirmez.

## Kısayolu değiştirmek

`init.lua` içindeki satır:

```lua
hs.hotkey.bind({"alt", "shift"}, "T", turkceDuzelt)
```

Değiştirdikten sonra Hammerspoon menüsünden "Reload Config".

## Hammerspoon kurulamıyorsa (kurumsal Mac)

Gatekeeper ya da MDM Hammerspoon'un açılmasına ya da Erişilebilirlik iznine izin vermiyorsa
üçüncü parti uygulama gerektirmeyen yol: macOS Kısayollar uygulamasında bir Hızlı Eylem.
Kurumsal bir cihazda önce BT politikasını kontrol et; Kısayollar'da betik çalıştırma izni de
politikaya aykırı olabilir.

"Panoyu Al" → "Kabuk Betiği Çalıştır" → "Panoya Kopyala" adımlarıyla bir kısayol kur ve ona
⌥⇧T ata. Kabuk betiği, stdin'den gelen metni geçici bir dosyaya yazıp
`LC_ALL=en_US.UTF-8 /usr/bin/osascript -l JavaScript ~/.hammerspoon/deasciify.js <dosya>`
çalıştırır. Kısayollar > Ayarlar > Gelişmiş > "Betiklerin Çalıştırılmasına İzin Ver" açık
olmalı. Kullanım: metni seç, ⌘C, ⌥⇧T, ⌘V. Yalnızca panoya dokunduğu için yine her uygulamada
çalışır; bedeli iki tuş fazlası. Bu yol tarif edilmiştir, bu depoda uçtan uca test edilmemiştir.

## Sınırlar

- Algoritma yazım hatası düzeltmez; hatalı yazılmış kelimeye yanlış Türkçe karakter ekleyebilir.
- Şapkalı ayrımları (kar/kâr, hala/hâlâ) yapmaz, cümle başını büyük harfe çevirmez.
- Bazı kelimeleri bağlama göre kaçırır ("bu metni turkcelestir" içindeki ü gibi); bunlar için
  kişisel sözlük var.
- Korunan parçalar dışındaki İngilizce kelimelere genelde dokunmaz, ama garanti değil.
- Zengin metin seçimi düz metin olarak yapıştırılır, biçim kaybolur.
- Pano yöneticileri (Maccy, Paste) ve iCloud Universal Clipboard dönüştürülen metni ve geri
  yüklenen eski panoyu yeni girdi olarak kaydeder; parola gibi hassas bir şey panodayken
  kısayolu kullanma.
- Seçim yoksa "Seçili metin yok" uyarısı çıkar, pano geri yüklenir, metin değişmez.

## Teşekkür ve lisans

- Algoritma: [Deniz Yüret, turkish-mode for Emacs](https://github.com/emres/turkish-mode) (MIT).
- JavaScript portu: [Mustafa Emre Acer, deasciifier](https://github.com/meacer/deasciifier) (MIT).
  `deasciify.js`'nin ilk 301 satırı bu deponun `08a830b` commit'indeki `js/deasciifier.js` ile
  aynıdır; geri kalanı bu depoya ait giriş noktası, koruma ve sözlük katmanıdır.
- Bu depo: MIT, bkz. [LICENSE](LICENSE).
