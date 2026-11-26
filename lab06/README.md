**Оюутан:** Э.Цэгмид  
**Оюутны код:** B232270107  
**Хичээл:** F.CSA313 — Программ хангамжийн чанарын баталгаа ба тест (2026)

# Лаборатори №6 — Тест тохиолдол боловсруулах: Category-Partition ба PICT

## 1. Алхам 1 — PICT орчин

Microsoft PICT (3.7.4) хэрэгслийг эх кодоос нь repository-оос гадна (`C:\Users\tsegm\tools\pict`) MinGW (`mingw32-make -B pict`) ашиглан бүтээж, build болон хэрэглээний зааврын нотолгоог [`results/pict-build.txt`](results/pict-build.txt) файлд хадгалсан.

- **PICT хувилбар:** 3.7.4 (`ab76c25`)
- **Build команд:** `mingw32-make -B pict`
- **Build нотолгоо:** [`results/pict-build.txt`](results/pict-build.txt)

---

## 2. Хэсэг A — Category-Partition гараар (`POST /transfer`)

Тест хийгдэх функцийн тодорхойлолт:

```text
POST /transfer { "from": ID, "to": ID, "amount": NUM, "currency": CODE }
```

- **Амжилт:** `201 {"result":"OK"}`
- **Оролтын алдаа:** `200 {"result":"ERROR_..."}` (`ERROR_NO_FROM`, `ERROR_FROZEN`, `ERROR_NO_TO`, `ERROR_SAME_ACCOUNT`, `ERROR_BAD_AMOUNT`, `ERROR_INSUFFICIENT`, `ERROR_LIMIT`)
- **Валют ба хөрвүүлэлт:** `currency` нь `from` дансны валютаас өөр бол ханшаар хөрвүүлж, хөрвүүлсний дараах дүнгээр үлдэгдэл болон өдрийн лимитийг шалгана.

**Олон алдааны давуу эрэмбэ (Error Precedence):** Тодорхойлолтод давхар алдааны дарааллыг заагаагүй тул шалгах дарааллыг **`SenderAccount (from) → RecipientAccount (to) → AmountInput (≤ 0) → BalanceFit → DailyLimitFit`** гэж тогтоов; учир нь байхгүй эсвэл царцаагдсан эх дансны үлдэгдэл, хүлээн авагч болон хөрвүүлэлтийг шалгах боломжгүй бөгөөд `amount ≤ 0` үед үлдэгдэл, лимит харьцуулах утгагүй юм.

### A1. Сонголт ба төлөөлөх утгууд

`POST /transfer`-ийн оролт болон серверийн далд төлөв (`PriorDailySpend`) дээр тулгуурлан 7 ангилал (category), 18 төлөөлөх утгыг өөрөө зохиов.

| # | Ангилал (Category) | Төлөөлөх утга | Тэмдэглэгээ | Тайлбар |
|---|---|---|---|---|
| 1 | `SenderAccount` (`from`) | `Active` | `[property SenderOK]` | Байгаа, идэвхтэй (царцаагдаагүй) эх данс |
|   |  | `Frozen` | `[ERROR]` | Царцаагдсан эх данс → `ERROR_FROZEN` |
|   |  | `NotFound` | `[ERROR]` | Системд байхгүй эх данс → `ERROR_NO_FROM` |
| 2 | `RecipientAccount` (`to`) | `OtherActive` | `[property RecipientOK]` | Байгаа, `from`-оос өөр хүлээн авагч данс |
|   |  | `NotFound` | `[ERROR]` | Системд байхгүй хүлээн авагч → `ERROR_NO_TO` |
|   |  | `DuplicateSender` | `[ERROR]` | `from`-той ижил данс → `ERROR_SAME_ACCOUNT` |
| 3 | `AmountInput` (`amount`-ийн тэмдэг) | `Positive` | `[property PositiveAmt]` | Эерэг тоон утга (`amount > 0`) |
|   |  | `Zero` | `[ERROR]` | `0` дүн → `ERROR_BAD_AMOUNT` |
|   |  | `Negative` | `[ERROR]` | Сөрөг дүн (`< 0`) → `ERROR_BAD_AMOUNT` |
| 4 | `BalanceFit` *(хөрвүүлсний дараа)* | `UnderBalance` | `[IF PositiveAmt]` | Үлдэгдлээс бага дүн |
|   |  | `ExactBalance` | `[IF PositiveAmt] [SINGLE]` | Яг үлдэгдэлтэй тэнцүү дүн (boundary) |
|   |  | `ExceedsBalance` | `[IF PositiveAmt] [ERROR]` | Үлдэгдлээс их дүн → `ERROR_INSUFFICIENT` |
| 5 | `DailyLimitFit` *(хөрвүүлсний дараа)* | `UnderLimit` | `[IF PositiveAmt]` | Өдрийн үлдсэн лимитээс бага дүн |
|   |  | `ExactLimit` | `[IF PositiveAmt] [SINGLE]` | Яг өдрийн үлдсэн лимиттэй тэнцүү дүн (boundary) |
|   |  | `ExceedsLimit` | `[IF PositiveAmt] [ERROR]` | Өдрийн үлдсэн лимитээс их дүн → `ERROR_LIMIT` |
| 6 | `CurrencyMode` (`currency`) | `SameAsAccount` | — | Дансны үндсэн валюттай ижил (хөрвүүлэлтгүй) |
|   |  | `CrossCurrency` | `[property FX]` | Өөр валют (жишээ нь USD → MNT хөрвүүлэлттэй) |
| 7 | `PriorDailySpend` *(далд орчин)* | `ZeroSpent` | — | Тухайн өдөр өмнө нь огт шилжүүлэг хийгээгүй (`usedToday = 0`) |
|   |  | `PartiallySpent` | `[property HasSpent]` | Өдрийн лимитийн хэсгийг урьдчилж зарцуулсан (`usedToday > 0`) |

**Далд орчны сонголтын тайлбар:** `BalanceFit`, `DailyLimitFit`, `PriorDailySpend` нь хүсэлтийн JSON биед шууд харагдахгүй боловч серверийн төлөв (`balance`, `dailyLimit`, `usedToday`, ханш) дээр тулгуурлан яг ижил хүсэлтийг амжилттай эсвэл `ERROR_INSUFFICIENT` / `ERROR_LIMIT` болгодог далд орчны хүчин зүйлүүд юм.

### A2. Хязгаарлалтууд ба комбинацийн тооцоо

| Тэмдэглэгээ | Хамаарах утга | Үндэслэл |
|---|---|---|
| `[ERROR]` | `SenderAccount`: `Frozen`, `NotFound` | Эх дансны алдаа шууд `ERROR_FROZEN` эсвэл `ERROR_NO_FROM` буцаах тул бусад оролтыг хүчинтэй байлгаж error masking-аас сэргийлнэ. |
| `[ERROR]` | `RecipientAccount`: `NotFound`, `DuplicateSender` | Хүлээн авагч буруу үед дүн болон үлдэгдлийн алдааг холихгүйн тулд бусад сонголтыг хүчинтэй барина. |
| `[ERROR]` | `AmountInput`: `Zero`, `Negative` | `amount ≤ 0` үед үлдэгдэл ба өдрийн лимитээс хэтрэх боломжгүй тул `UnderBalance` ба `UnderLimit` утгатай дангаар шалгана. |
| `[ERROR]` | `BalanceFit`: `ExceedsBalance` | `ERROR_INSUFFICIENT`-ийг цэвэр шалгахын тулд `DailyLimitFit = UnderLimit` байхад тусгаарлана. |
| `[ERROR]` | `DailyLimitFit`: `ExceedsLimit` | `ERROR_LIMIT`-ийг өмнөх зарцуулалттай хослуулан шалгахын тулд `PriorDailySpend = PartiallySpent` нөхцөлд шалгана. |
| `[IF PositiveAmt]` | `BalanceFit`, `DailyLimitFit`-ийн бүх утга | `AmountInput = Positive` үед л үлдэгдэл болон лимитийн харьцуулалт утгатай болно. |
| `[SINGLE]` | `ExactBalance` | Үлдэгдэлтэй яг тэнцүү boundary (`<` vs `<=` алдааг илрүүлэх) нь энгийн орчинд (`SameAsAccount`, `ZeroSpent`, `UnderLimit`) ганц удаа шалгахад хангалттай. |
| `[SINGLE]` | `ExactLimit` | Өдрийн үлдсэн лимиттэй яг тэнцүү boundary нь энгийн орчинд (`SameAsAccount`, `PartiallySpent`, `UnderBalance`) ганц удаа шалгахад хангалттай. |

[`transfer.model`](transfer.model) файлд буулгасан PICT `IF` хязгаарлалтууд:

```text
IF [SenderAccount] <> "Active" THEN [RecipientAccount] = "OtherActive" AND [AmountInput] = "Positive" AND [BalanceFit] = "UnderBalance" AND [DailyLimitFit] = "UnderLimit";
IF [RecipientAccount] <> "OtherActive" THEN [AmountInput] = "Positive" AND [BalanceFit] = "UnderBalance" AND [DailyLimitFit] = "UnderLimit";
IF [AmountInput] <> "Positive" THEN [BalanceFit] = "UnderBalance" AND [DailyLimitFit] = "UnderLimit";
IF [BalanceFit] = "ExceedsBalance" THEN [DailyLimitFit] = "UnderLimit";
IF [BalanceFit] = "ExactBalance" THEN [SenderAccount] = "Active" AND [RecipientAccount] = "OtherActive" AND [AmountInput] = "Positive" AND [DailyLimitFit] = "UnderLimit" AND [CurrencyMode] = "SameAsAccount" AND [PriorDailySpend] = "ZeroSpent";
IF [DailyLimitFit] = "ExactLimit" THEN [SenderAccount] = "Active" AND [RecipientAccount] = "OtherActive" AND [AmountInput] = "Positive" AND [BalanceFit] = "UnderBalance" AND [CurrencyMode] = "SameAsAccount" AND [PriorDailySpend] = "PartiallySpent";
IF [DailyLimitFit] = "ExceedsLimit" THEN [PriorDailySpend] = "PartiallySpent";
```

**Хязгаарлалтаас өмнөх бүрэн комбинацийн тоо:**

$$
3 \times 3 \times 3 \times 3 \times 3 \times 2 \times 2 = 972
$$

**Хязгаарлалтын дараах хүчинтэй комбинацийн тоо:**

1. `SenderAccount` алдаатай (`Frozen`, `NotFound` — 2 утга), `RecipientAccount = OtherActive`, `AmountInput = Positive`, `UnderBalance`, `UnderLimit`, `CurrencyMode` (2) × `PriorDailySpend` (2): $2 \times 2 \times 2 = 8$
2. `SenderAccount = Active`, `RecipientAccount` алдаатай (`NotFound`, `DuplicateSender` — 2 утга), дүн/үлдэгдэл/лимит хэвийн, `CurrencyMode` (2) × `PriorDailySpend` (2): $2 \times 2 \times 2 = 8$
3. `SenderAccount = Active`, `RecipientAccount = OtherActive`, `AmountInput` алдаатай (`Zero`, `Negative` — 2 утга), `UnderBalance`, `UnderLimit`, `CurrencyMode` (2) × `PriorDailySpend` (2): $2 \times 2 \times 2 = 8$
4. Бүгд хүчинтэй ба `AmountInput = Positive` үед `(BalanceFit, DailyLimitFit, CurrencyMode, PriorDailySpend)` боломжууд:
   - `ExactBalance` (`[SINGLE]`): `UnderLimit`, `SameAsAccount`, `ZeroSpent` → $1$
   - `ExceedsBalance`: `UnderLimit`, `CurrencyMode` (2) × `PriorDailySpend` (2) → $4$
   - `UnderBalance` + `ExactLimit` (`[SINGLE]`): `SameAsAccount`, `PartiallySpent` → $1$
   - `UnderBalance` + `ExceedsLimit`: `PartiallySpent`, `CurrencyMode` (2) → $2$
   - `UnderBalance` + `UnderLimit` (энгийн Happy Path): `CurrencyMode` (2) × `PriorDailySpend` (2) → $4$
   Дэд нийлбэр: $1 + 4 + 1 + 2 + 4 = 12$.

Нийт хүчинтэй комбинаци:

$$
8 + 8 + 8 + 12 = 36 \quad (\mathbf{972 \rightarrow 36})
$$

> `36` нь хязгаарлалт хангасан нийт хүчинтэй комбинацийн олонлогийн хэмжээ бөгөөд PICT-ийн 2-way covering array-ийн мөрийн тоо (`18`) биш.

### A3. Спецификацийн хүснэгт (14 спецификаци)

| ID | SenderAccount | RecipientAccount | AmountInput | BalanceFit | DailyLimitFit | CurrencyMode | PriorDailySpend | Хүлээгдэх үр дүн |
|---|---|---|---|---|---|---|---|---|
| A01 | Active | OtherActive | Positive | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `201 {"result":"OK"}` *(Happy path)* |
| A02 | Active | OtherActive | Positive | UnderBalance | UnderLimit | CrossCurrency | PartiallySpent | `201 {"result":"OK"}` *(FX хөрвүүлэлттэй амжилт)* |
| A03 | Active | OtherActive | Positive | ExactBalance | UnderLimit | SameAsAccount | ZeroSpent | `201 {"result":"OK"}` *(`[SINGLE]` үлдэгдэл 0 болно)* |
| A04 | Active | OtherActive | Positive | UnderBalance | ExactLimit | SameAsAccount | PartiallySpent | `201 {"result":"OK"}` *(`[SINGLE]` лимит яг тулна)* |
| A05 | Frozen | OtherActive | Positive | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_FROZEN"}` |
| A06 | NotFound | OtherActive | Positive | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_NO_FROM"}` |
| A07 | Active | NotFound | Positive | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_NO_TO"}` |
| A08 | Active | DuplicateSender | Positive | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_SAME_ACCOUNT"}` |
| A09 | Active | OtherActive | Zero | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_BAD_AMOUNT"}` |
| A10 | Active | OtherActive | Negative | UnderBalance | UnderLimit | CrossCurrency | ZeroSpent | `200 {"result":"ERROR_BAD_AMOUNT"}` |
| A11 | Active | OtherActive | Positive | ExceedsBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_INSUFFICIENT"}` |
| A12 | Active | OtherActive | Positive | ExceedsBalance | UnderLimit | CrossCurrency | ZeroSpent | `200 {"result":"ERROR_INSUFFICIENT"}` *(хөрвүүлсний дараа үлдэгдэл дутна)* |
| A13 | Active | OtherActive | Positive | UnderBalance | ExceedsLimit | CrossCurrency | PartiallySpent | `200 {"result":"ERROR_LIMIT"}` *(хөрвүүлсний дараа лимит хэтэрнэ)* |
| A14 | Frozen | DuplicateSender | Negative | UnderBalance | UnderLimit | SameAsAccount | ZeroSpent | `200 {"result":"ERROR_FROZEN"}` *(давхар нөхцөл: `from > to > amount`)* |

---

## 3. Хэсэг B — PICT: pairwise covering array

### B1. Лекцийн браузерын жишээ (`browser.model`)

[`browser.model`](browser.model) файлыг `/r` (санамсаргүй seed) ашиглалгүйгээр 2-way ба 3-way горимоор ажиллуулав:

$$
\text{Бүрэн комбинаци} = 3 \times 3 \times 2 \times 2 \times 2 \times 2 = 144
$$

| Горим | Бүрэн комбинаци | PICT мөрийн тоо | Үр дүнгийн файл |
|---|---:|---:|---|
| 2-way (default) | 144 | 10 | [`results/browser-2way.txt`](results/browser-2way.txt) |
| 3-way (`/o:3`) | 144 | 20 | [`results/browser-3way.txt`](results/browser-3way.txt) |

**Яагаад 9 биш 10 мөр болов?** Лекц дээр гараар 9 мөрөнд багтааж болох боловч PICT нь математик оптимум олдоггүй, алхам бүрт хамгийн олон хамрагдаагүй хосыг авах **greedy** эвристик алгоритмаар ажилладаг. Эхний мөрүүдэд хийсэн greedy сонголт нь сүүлийн үлдсэн хосыг нэмэлт 10 дахь мөрөөр хаахад хүргэдэг бөгөөд `/r`-гүйгээр үргэлж яг ижил deterministic 10 мөр үүсгэнэ. 3-way горимд гурван параметрийн бүх хослолыг хамруулснаар 144 бүрэн комбинацаас ердөө 20 мөр үүсэв.

### B2. Шилжүүлгийн гурван PICT модель ба харьцуулалт

Хэсэг A-гийн 7 ангиллыг ижил бүтцээр гурван хувилбарт буулгаж, `/r`-гүйгээр PICT ажиллуулав:

1. [`transfer-nc.model`](transfer-nc.model) → [`results/transfer-nc.txt`](results/transfer-nc.txt) (хязгаарлалтгүй)
2. [`transfer.model`](transfer.model) → [`results/transfer.txt`](results/transfer.txt) (A2-ын 7 `IF` хязгаарлалттай)
3. [`transfer-neg.model`](transfer-neg.model) → [`results/transfer-neg.txt`](results/transfer-neg.txt) (`[ERROR]` утгуудыг `~`-ээр тэмдэглэж, `[SINGLE]` ба `ExceedsLimit → PartiallySpent` `IF` дүрмүүдийг хадгалсан)

**Тооллын тодорхойлолт (толгой мөрийг хассан бодит өгөгдлийн мөр бүрээр):**

- **Энгийн Happy Path:** `SenderAccount = Active`, `RecipientAccount = OtherActive`, `AmountInput = Positive`, `BalanceFit = UnderBalance`, `DailyLimitFit = UnderLimit` (алдаагүй, boundary бус стандарт амжилттай шилжүүлэг).
- **Нийт `0 алдаа` мөр:** Энгийн Happy Path + `[SINGLE]` boundary (`ExactBalance` эсвэл `ExactLimit`) алдаагүй мөрүүдийн нийлбэр.
- **Нэг мөр дэх алдааны тоо:** `SenderAccount ≠ Active`, `RecipientAccount ≠ OtherActive`, `AmountInput ≠ Positive`, `BalanceFit = ExceedsBalance`, `DailyLimitFit = ExceedsLimit` гэсэн 5 алдааны эх үүсвэрээс тухайн мөрөнд орсон алдааны тоо (`~` угтвартай эсэхээс үл хамааран).

| Загвар / Үр дүн | Тусгай механизм | Нийт мөр | Энгийн Happy Path | Нийт `0 алдаа` | `1 алдаа` | `2+ алдаа` |
|---|---|---:|---:|---:|---:|---:|
| [`transfer-nc.txt`](results/transfer-nc.txt) | Хязгаарлалтгүй (`nc`) | 14 | 0 | 1 | 0 | 13 |
| [`transfer.txt`](results/transfer.txt) | A2-ын `IF` хязгаарлалттай | 18 | 0 | 2 | 16 | 0 |
| [`transfer-neg.txt`](results/transfer-neg.txt) | `~` сөрөг утга + `[SINGLE]`/`[IF]` | 21 | 3 | 5 | 16 | 0 |

**Гаралтын шинжилгээ ба асуултуудын хариу:**

- **Happy Path мөр гарсан уу?**
  - `transfer-nc.txt`-д энгийн Happy Path **0 мөр** гарсан; харин 10-р мөр (өгөгдлийн 9-р мөр) нь `ExactBalance + ExactLimit` давхцсан `0 алдаа`-тай boundary мөр тул нийт `0 алдаа = 1` болов.
  - `transfer.txt`-д энгийн (`UnderBalance + UnderLimit`) Happy Path мөр **0 ширхэг** гарсан; учир нь `UnderBalance`, `UnderLimit`, `Positive`, `Active`, `OtherActive` утгуудын бүх 2-way хос нь бусад 16 ганц алдаатай мөрт бүрэн зарцуулагдсан. Гэхдээ `[SINGLE]` дүрмийн ачаар `ExactBalance` (өгөгдлийн 12-р мөр) ба `ExactLimit` (өгөгдлийн 18-р мөр) гэсэн 2 boundary `0 алдаа` мөр үүссэн.
  - `transfer-neg.txt`-д `~` тэмдэглэгээ нь эерэг утгуудын хосыг тусад нь хамардаг тул **3 энгийн Happy Path** (өгөгдлийн 1, 3, 5-р мөр) болон **2 `[SINGLE]` boundary** (өгөгдлийн 2, 4-р мөр), нийт **5 алдаагүй мөр** гарсан.
- **Нэг мөрөнд хэдэн алдаа зэрэг орсон бэ?**
  - `transfer-nc.txt`-д ганц алдаатай мөр **0**, харин **13 мөр** нь 2–4 алдааг зэрэг агуулсан (`2 алдаа: 5 мөр`, `3 алдаа: 4 мөр`, `4 алдаа: 4 мөр`), мөн `Zero` + `ExceedsBalance` гэх мэт утгагүй хослолууд үүссэн. Ийм олон алдаатай мөр яг аль алдааг шалгаж байгаа нь тодорхойгүй (`error masking`).
  - `transfer.txt` ба `transfer-neg.txt`-д `2+ алдаа` **0** болж, алдаатай бүх **16 мөр** яг 1 алдаатай цэвэр тест болсон.
- **`~` хэрэглэхэд A2-ын хязгаарлалт хэрэгтэй хэвээр үлдсэн үү?**
  - **Тийм, хэсэгчлэн үлдсэн.** `~` нь зөвхөн сөрөг утгуудыг хооронд нь холихоос сэргийлдэг тул эхний 4 `IF` дүрмийг (error-isolation) орлож чадна. Харин `[SINGLE]` (`ExactBalance`, `ExactLimit`-ийг энгийн орчинд барих) болон `[IF]` (`ExceedsLimit → PartiallySpent`) хязгаарлалтыг `~` орлохгүй тул [`transfer-neg.model`](transfer-neg.model)-д 3 `IF` дүрмийг заавал хэвээр үлдээсэн.

**PICT мөрөөс бодит тест кейс (Лаб 5-ын хэв маягаар):**

> Мөрийн дугаарлалтад толгой мөр (файлын 1-р мөр)-ийг хассан **өгөгдлийн мөрийн дугаар** болон файлын бодит мөрийн дугаарыг хоёуланг нь тэмдэглэв.

| Кейс | Эх сурвалж ба PICT мөр | Setup | Оролт (`POST /transfer`) | Oracle |
|---|---|---|---|---|
| **T01** *(Happy path)* | `transfer-neg.txt` өгөгдлийн #3 (мөр 4): `Active, OtherActive, Positive, UnderBalance, UnderLimit, CrossCurrency, ZeroSpent` | `ACC_A`: `MNT`, үлдэгдэл `1,000,000`, `frozen: false`, `usedToday: 0` (лимит `500,000`); `ACC_B`: `MNT`, үлдэгдэл `0`; ханш `1 USD = 3,400 MNT` | `{"from":"ACC_A","to":"ACC_B","amount":100,"currency":"USD"}` | `201 {"result":"OK"}`; `ACC_A` үлдэгдэл `660,000`, `ACC_B` `340,000`, `usedToday: 340,000` |
| **T02** *(Сөрөг дүн)* | `transfer-neg.txt` өгөгдлийн #10 (мөр 11): `Active, OtherActive, ~Negative, UnderBalance, UnderLimit, CrossCurrency, ZeroSpent` | `ACC_A`: `MNT`, үлдэгдэл `1,000,000`, `frozen: false`, `usedToday: 0`; `ACC_B`: `MNT`, үлдэгдэл `0` | `{"from":"ACC_A","to":"ACC_B","amount":-50,"currency":"USD"}` | `200 {"result":"ERROR_BAD_AMOUNT"}`; үлдэгдэл өөрчлөгдөхгүй |
| **T03** *(FX + Үлдэгдэл хэтэрсэн)* | `transfer-neg.txt` өгөгдлийн #9 (мөр 10): `Active, OtherActive, Positive, ~ExceedsBalance, UnderLimit, CrossCurrency, ZeroSpent` | `ACC_A`: `MNT`, үлдэгдэл `300,000`, `frozen: false`, `usedToday: 0` (лимит `1,000,000`); `ACC_B`: `MNT`, үлдэгдэл `0`; ханш `1 USD = 3,400 MNT` | `{"from":"ACC_A","to":"ACC_B","amount":100,"currency":"USD"}` *(хөрвүүлээд `340,000 > 300,000`)* | `200 {"result":"ERROR_INSUFFICIENT"}`; үлдэгдэл өөрчлөгдөхгүй |
| **T04** *(Олон алдаатай мөр)* | `transfer-nc.txt` өгөгдлийн #2 (мөр 3): `Frozen, NotFound, Positive, ExceedsBalance, UnderLimit, SameAsAccount, ZeroSpent` | `ACC_F`: `MNT`, үлдэгдэл `50,000`, `frozen: true`, `usedToday: 0`; `ACC_MISSING` бүртгэлгүй | `{"from":"ACC_F","to":"ACC_MISSING","amount":200000,"currency":"MNT"}` | `200 {"result":"ERROR_FROZEN"}` *(давуу эрэмбээр `from > to > balance` тул `ERROR_NO_TO` буюу `ERROR_INSUFFICIENT` биш)* |

---

### B3. Гараар хийсэн A3 ба PICT-ийн харьцуулалт

| Шалгуур | Гараар хийсэн A3 хүснэгт | PICT (`transfer-neg.txt` / `transfer.txt`) |
|---|---|---|
| **Алдааны семантик** | **Давуу** — мөр бүрийн зорилго, бизнесийн дүрэм, давхар алдааны эрэмбийг (`A14`) санаатай тодорхойлно. | `~` эсвэл `IF`-гүй бол (`transfer-nc`) 13/14 мөрөнд олон алдаа давхцаж error masking үүсгэнэ. |
| **Хосын хамралт** | Баталгаагүй — хүн зарим орчны хослолыг (жишээ нь `CrossCurrency × PartiallySpent × ERROR_NO_FROM`) орхигдуулж болно. | **Математик баталгаатай** — бүх хүчинтэй 2-way хосыг системтэй бөгөөд давтагдахуйц байдлаар хамарна. |
| **Boundary ба тусгай нөхцөл** | `ExactBalance`, `ExactLimit`-ийг шууд оруулан шалгана. | `[SINGLE]` хязгаарлалт тавихгүй бол PICT boundary утгыг бүх алдаатай хольж гаргана. |
| **Үйлчилгээ ба өргөтгөл** | Параметр нэмэгдэхэд хүснэгтийг гараар шинэчлэхэд цаг их орно. | Моделийг засаад секундэд дахин үүсгэнэ. |

---

## 4. Дүгнэлт

Category-Partition болон PICT аргууд нь тест дизайны ялгаатай хоёр талыг нөхөж өгдөг болохыг энэ лабораторийн ажлаар харлаа. Гараар зохиосон A3 хүснэгт нь бизнесийн дүрэм, алдааны анги бүрийн утга, `[SINGLE]` boundary болон олон алдааны давуу эрэмбийг тодорхой илэрхийлэх давуу талтай бол, PICT нь 7 ангиллын бүх боломжит 2-way хослолыг орхигдуулалгүй хамруулах баталгааг өгдөг. Хязгаарлалтгүй `transfer-nc.txt` (14 мөр)-ийн 13 мөр нь 2–4 алдааг зэрэг агуулж ганц алдаатай мөр огт гаргаагүй нь `IF` эсвэл `~`-гүй шууд combinatorial гаралт error masking үүсгэдгийг батлав. Харин 7 `IF` дүрмээр 972 хослолыг 36 хүчинтэй хослол болгон бууруулсан `transfer.txt` (18 мөр) нь олон алдааг 0 болгосон ч хүчинтэй утгууд алдааны мөрүүдэд зарцуулагдаж энгийн Happy Path мөр 0 ширхэг гарсан нь анхаарах үр дүн байлаа. `~` тэмдэглэгээтэй `transfer-neg.txt` (21 мөр) нь 3 энгийн Happy Path, 2 `[SINGLE]` boundary, 16 ганц алдаатай мөрийг цэврээр үүсгэсэн ч `[SINGLE]` болон `ExceedsLimit → PartiallySpent` дүрмүүдийг орлож чадахгүй тул `IF` хязгаарлалтыг хэвээр хадгалах шаардлагатай байв. Мөн `browser.model` дээр PICT 9 биш 10 мөр гаргасан нь greedy алгоритм хамгийн бага мөрийг заавал олохгүй ч хурдан, deterministic багц өгдгийг харуулав. Бүх алхмаас **хамгийн их бодол шаардсан нь А1/А2-ын ангилал задрал ба хязгаарлалт тавих алхам** байсан, учир нь `amount`-ийн тэмдэг, үлдэгдэл, лимит гурвыг тусад нь задалж 972 → 36 болгохдоо утгагүй хослолыг хасахын зэрэгцээ `CrossCurrency × ExceedsBalance` зэрэг заавал шалгах ёстой хослолыг санамсаргүй устгахгүй байх тэнцвэрийг олох хэрэгтэй болсон. Нэмэлтээр, олон алдаа давхацсан хүсэлтэд аль `ERROR_*` буцах нь тодорхойлолтод бичигдээгүй нь код бичихээс өмнө хөгжүүлэгчтэй тохирох ёстой shift-left цоорхой гэж үзэв. Иймээс практикт A3-ын семантик болон boundary тестүүдийг PICT-ийн `~` + `IF` pairwise багцтай хослуулан ашиглах нь хамгийн найдвартай арга юм.
