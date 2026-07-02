# Bloq - материалы для Chrome Web Store

Готовые тексты и данные для заполнения карточки в Developer Dashboard.
Пошаговый процесс - в [PUBLISHING.md](PUBLISHING.md).

- **Название (Name):** Bloq
- **Категория (Category):** Privacy & Security
- **Язык (Default language):** Русский (English - как дополнительный перевод)
- **Иконка магазина:** `icons/icon128.png`
- **Скриншоты:** `store-assets/screenshot-1.png`, `store-assets/screenshot-2.png` (1280×800)
- **Малый промо-тайл (опц.):** `store-assets/promo-small.png` (440×280)
- **Большой промо-баннер (опц.):** `store-assets/promo-marquee.png` (1400×560)
- **Privacy policy URL:** ссылка на [PRIVACY.md](PRIVACY.md) в опубликованном репозитории

---

## Краткое описание (Summary, RU) - лимит 132 символа

```
Bloq режет рекламу, трекеры и cookie-окна ещё до загрузки. Быстрее, чище, приватно - всё локально.
```

## Полное описание (Description, RU)

```
Bloq возвращает вебу тишину. Реклама, трекеры и надоедливые окна про cookie исчезают - остаётся страница, ради которой ты пришёл. Быстрее, чище, спокойнее. И всё это работает полностью на твоём устройстве: Bloq ничего не собирает и никуда не отправляет.

Что делает Bloq:

🛡️ Режет рекламу и трекеры на сетевом уровне. Запросы к рекламным сетям и аналитике блокируются ещё до загрузки через штатный механизм declarativeNetRequest - страницы открываются быстрее и не тянут лишний трафик. В списке около 90 доменов рекламных сетей, включая российские (Яндекс.Директ, AdFox, VK Ads, MyTarget), плюс generic-паттерны вроде «ads.» и «adserver.». Правила бьют только сторонние запросы и не трогают основную страницу, поэтому сайты не ломаются.

🧹 Скрывает рекламные баннеры и пустые блоки, которые остаются на месте вырезанной рекламы. Никаких зияющих дыр в вёрстке - место под баннер не мигает и не занимает экран.

🍪 Гасит cookie-попапы. Bloq убирает баннеры согласия 20+ популярных CMP (OneTrust, Cookiebot, Didomi, Usercentrics, Quantcast и др.), а в 11 из них сам жмёт «Отклонить все» и снимает навязанную блокировку прокрутки. Ты просто читаешь, а не кликаешь по окнам.

🔢 Показывает счётчик заблокированных запросов прямо на иконке - видно, сколько мусора отсечено.

О приватности честно: Bloq ничего не собирает и никуда не отправляет. Нет аккаунтов, нет серверов, нет аналитики, ноль телеметрии. Все настройки - глобальный переключатель и список исключений - хранятся только в chrome.storage.local на твоём устройстве. Из разрешений Bloq просит лишь declarativeNetRequest, storage и activeTab; широких прав доступа ко всем сайтам расширение НЕ запрашивает.

Управление в один клик. Клик по иконке - и один тумблер включает или выключает защиту глобально. Мешает на конкретном сайте? Добавь его в исключения в один клик (allowlist по домену) - остальной веб останется чистым. Ты сам решаешь, где Bloq работает.

Bloq - это блокировщик, а не VPN и не антивирус. Он не прячет твой IP и не лечит вирусы. Он делает одно дело и делает его честно: убирает из веба рекламу, трекеры и надоедливые попапы, чтобы читать и работать было приятно. Поставь и забудь - работает сразу, настройка не нужна.
```

## Краткое описание (Summary, EN) - лимит 132 символа

```
Blocks ads, trackers and cookie pop-ups before they load. Faster, cleaner, private - all on your device.
```

## Полное описание (Description, EN)

```
Bloq brings the quiet back to the web. Ads, trackers and annoying cookie consent windows disappear - leaving only the page you actually came for. Faster, cleaner, calmer. And it all runs entirely on your device: Bloq collects nothing and sends nothing anywhere.

What Bloq does:

🛡️ Blocks ads and trackers at the network level. Requests to ad networks and analytics are stopped before they even load, using Chrome's built-in declarativeNetRequest engine - so pages open faster and pull less traffic. The list covers around 90 ad-network and tracker domains (including Russian ones like Yandex.Direct, AdFox, VK Ads, MyTarget), plus generic patterns such as "ads." and "adserver.". Rules hit only third-party requests and never touch the main page, so sites keep working.

🧹 Hides ad banners and the empty blocks left where an ad used to be. No gaping holes in the layout - the reserved space no longer flickers or eats your screen.

🍪 Silences cookie pop-ups. Bloq hides consent banners from 20+ popular CMPs (OneTrust, Cookiebot, Didomi, Usercentrics, Quantcast and more) and, in 11 of them, automatically clicks "Reject all" and removes the forced scroll lock. You just read instead of clicking through windows.

🔢 Shows a counter of blocked requests right on the toolbar icon - so you can see how much junk was cut.

Honest about privacy: Bloq collects nothing and transmits nothing. No accounts, no servers, no analytics, zero telemetry. All settings - the global toggle and your allowlist - are stored only in chrome.storage.local on your own device. Bloq asks for just three permissions: declarativeNetRequest, storage and activeTab. It does NOT request broad access to all websites.

One-click control. Click the icon and a single toggle turns protection on or off globally. A site behaving badly? Add it to your exceptions in one click (per-domain allowlist) - the rest of the web stays clean. You decide where Bloq runs.

Bloq is an ad blocker, not a VPN or an antivirus. It won't hide your IP or remove viruses. It does one job and does it honestly: it strips ads, trackers and pushy pop-ups out of the web so reading and working feel pleasant again. Install it and forget it - it works right away, no setup needed.
```

---

## Вкладка Privacy practices (для ревью)

### Single purpose

```
Bloq blocks advertising and tracking requests, hides leftover ad banners, and suppresses cookie-consent pop-ups so pages load faster and cleaner. It is a single-purpose content blocker that runs entirely locally and lets the user disable it globally or per site.
```

### Обоснования разрешений (Permission justifications)

**declarativeNetRequest**
```
Used to block requests to ad and tracker domains before they load, via a bundled set of static rules. No web request content is read or intercepted at runtime; Chrome enforces the static ruleset.
```

**storage**
```
Used to store the user's settings locally: the global on/off toggle and the per-domain allowlist of sites where blocking is disabled. Data stays in chrome.storage.local on the device and is never transmitted.
```

**activeTab**
```
Used only when the user opens the popup, to read the current tab's domain so it can be added to or removed from the allowlist. No broad host access is requested and no other tab data is accessed.
```

**Host access (контент-скрипт с matches http/https)**
```
Bloq's content script runs on all http and https pages to hide ad banners and suppress cookie-consent pop-ups directly in the page (cosmetic filtering). Broad host matching is required because ads and consent dialogs can appear on any website the user visits. The content script only reads and modifies the page DOM locally to hide elements and click "reject all"; it does not collect, store, or transmit page content or user data.
```

**Remote code (удалённый код)** - ответ **No**
```
Bloq does not use remote code. All scripts and the blocking ruleset are bundled in the extension package; nothing is fetched or executed from remote sources.
```

### Data usage

```
Bloq does not collect, use, transmit, or sell any user data. It has no accounts, no servers, and no analytics or telemetry. The only data it stores is the user's own settings (global on/off toggle and per-site allowlist), kept locally in chrome.storage.local on the user's device and never sent anywhere. This extension complies with the Chrome Web Store Developer Program Policies and its use of permissions is limited to the single purpose described.
```
