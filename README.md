# Lab 6: Pairwise Testing with PICT

**Оюутан:** Э.Цэгмид  
**Оюутны код:** B232270107

## Хэсэг A: Model Design

### 1. Сонголт ба утгын хүснэгт (Selection/Value Table)

| Параметр | Боломжит утгууд (Values) | Тайлбар |
|---|---|---|
| **From** | Valid, Frozen, Missing | Илгээгчийн дансны төлөв |
| **To** | Valid, Missing, SameAsFrom | Хүлээн авагчийн дансны төлөв |
| **Amount** | Zero, Normal, OverBalance, OverLimit | Гүйлгээний дүнгийн төрөл |
| **Currency** | Same, Different | Дансны валют ижил эсвэл ялгаатай байх |

### 2. Хязгаарлалтууд (Constraints) ба үндэслэл

Модельд дараах хоёр хязгаарлалтыг тодорхойлсон:

- `IF [From] = "Missing" THEN [Amount] = "Normal";`
- `IF [To] = "Missing" THEN [Amount] = "Normal";`

**Үндэслэл:** Илгээгчийн эсвэл хүлээн авагчийн данс байхгүй тохиолдолд гүйлгээний бусад параметрүүдийг хянахад тохиромжтой байлгахын тулд дүнг `Normal` утгаар хязгаарласан. Энэ нь тухайн тестийн моделийн сонгосон дүрэм бөгөөд бодит системийн бизнесийн шаардлагатай нийцэж байгаа эсэхийг тусад нь баталгаажуулах шаардлагатай.

### 3. Боломжит комбинацын тооцоолол

Хязгаарлалт хэрэгжүүлэхээс өмнөх бүх боломжит комбинацын тоо:

\[
N= 3 * 3 * 4 * 2 =72
\]

Хоёр constraint-ийг хэрэгжүүлсний дараа:

- `From = Missing` үед `Amount = Normal`.
- `To = Missing` үед `Amount = Normal`.

Эдгээр нөхцөлийг хангасан комбинацын тоо:

- `From = Missing`: \(1\times3\times1\times2=6\)
- `From ≠ Missing`, `To = Missing`: \(2\times1\times1\times2=4\)
- `From ≠ Missing`, `To ≠ Missing`: \(2\times2\times4\times2=32\)

Иймээс хүчинтэй комбинацын нийт тоо:

\[
N_{\text{valid}}=6+4+32=42
\]

PICT-ийн үүсгэсэн тестийн кейсийн тоог \(M\) гэж тэмдэглэвэл, бүх 72 комбинацтай харьцуулсан бууралтын хувь:

\[
R=\frac{72-M}{72}\times100\%
\]

Харин constraint-ийн дараах 42 хүчинтэй комбинацтай харьцуулбал:

\[
R_{\text{valid}}=\frac{42-M}{42}\times100\%
\]

**Тайлбар:** PICT-ийн бодит гаралтаас \(M\)-ийн утгыг авч байж бууралтын хувийг эцэслэн тогтооно. Pairwise testing нь бүх боломжит комбинацыг биш, хүчинтэй хослолуудыг хамруулах зорилготой тул дээрх хоёр хувийг хооронд нь ялгаж тайлбарлах хэрэгтэй.

### 4. Тестийн спецификацийн хүснэгт (Test Specifications)

| ID | From | To | Amount | Currency | Төрөл / Хүлээгдэх үр дүн |
|---:|---|---|---|---|---|
| 1 | Valid | Valid | Normal | Same | Happy Path — гүйлгээ амжилттай |
| 2 | Frozen | Valid | Normal | Same | Account Frozen — гүйлгээ татгалзагдана |
| 3 | Valid | Missing | Normal | Same | Recipient Missing — гүйлгээ татгалзагдана |
| 4 | Valid | Valid | OverBalance | Same | Insufficient Funds — үлдэгдэл хүрэлцэхгүй |
| 5 | Valid | Valid | OverLimit | Same | Limit Exceeded — гүйлгээний лимит хэтэрсэн |
| 6 | Valid | Valid | Zero | Same | Invalid Amount — дүн тэг байна |
| 7 | Valid | Valid | Normal | Different | Currency Conversion — хөрвүүлэлт амжилттай |
| 8 | Frozen | Missing | Normal | Different | Priority Error — Frozen алдааг түрүүлж буцаана |
| 9 | Missing | Valid | Normal | Same | Sender Missing — илгээгчийн данс байхгүй |
| 10 | Valid | SameAsFrom | Normal | Same | Same Account Transfer — ижил данс руу шилжүүлэхийг хориглоно |

### 5. PICT-ийн үр дүнгийн тэмдэглэгээ (Annotated Results)

**Тэмдэглэгээний утга:**
- `[ERROR]`: тухайн утга системийн алдаа үүсгэнэ (`transfer-neg` загварт `~` угтвартай).
- `[SINGLE]`: алдааг ганцаарчлан шалгана, өөр параметрүүд хүчинтэй утгатай байна.
- `[IF]`: constraint-ийн нөхцөл болох эсвэл constraint-ээр тогтоогдсон утга.

**A2. Утга бүрийн тэмдэглэгээ ба A3. хүлээгдэх алдааны код:**

| Параметр | Утга | Тэмдэглэгээ | Хүлээгдэх код (A3) |
|---|---|---|---|
| From | Valid | — | — |
| From | Frozen | `[ERROR]` `[SINGLE]` | `ERROR_SENDER_FROZEN` |
| From | Missing | `[ERROR]` `[SINGLE]` `[IF]` (нөхцөл: Amount = Normal) | `ERROR_SENDER_MISSING` |
| To | Valid | — | — |
| To | Missing | `[ERROR]` `[SINGLE]` `[IF]` (нөхцөл: Amount = Normal) | `ERROR_RECIPIENT_MISSING` |
| To | SameAsFrom | `[ERROR]` `[SINGLE]` | `ERROR_SAME_ACCOUNT` |
| Amount | Zero | `[ERROR]` `[SINGLE]` | `ERROR_INVALID_AMOUNT` |
| Amount | Normal | `[IF]` (From/To = Missing үед заавал энэ утга) | — |
| Amount | OverBalance | `[ERROR]` `[SINGLE]` | `ERROR_INVALID_AMOUNT` |
| Amount | OverLimit | `[ERROR]` `[SINGLE]` | `ERROR_INVALID_AMOUNT` |
| Currency | Same | — | — |
| Currency | Different | — (хөрвүүлэлт, алдаа биш) | — |

**Хүлээгдэх алдааны кодууд:**
- `ERROR_SENDER_MISSING`: Илгээгч байхгүй
- `ERROR_SENDER_FROZEN`: Илгээгч хөлдөөгдсөн
- `ERROR_RECIPIENT_MISSING`: Хүлээн авагч байхгүй
- `ERROR_INVALID_AMOUNT`: Дүн буруу (Zero, OverBalance, OverLimit)
- `ERROR_SAME_ACCOUNT`: Ижил данс руу шилжүүлэлт

**Анхаарах зүйл:** OverBalance болон OverLimit нь тестийн спецификацид тусдаа нэртэй (Insufficient Funds, Limit Exceeded) боловч дээрх жагсаалтад нэг `ERROR_INVALID_AMOUNT` код хуваалцаж байна. Бодит API тусдаа код буцаадаг бол энэ хүснэгтийг түүнд тааруулна.

**Алдааны давуу эрэмбэ:**

1. Sender Missing / Account Frozen
2. Recipient Missing
3. Amount Issues
4. Currency Issues

Энэхүү эрэмбэ нь олон алдааны нөхцөл зэрэг үүссэн үед систем аль алдааг эхэлж буцаахыг тодорхойлсон бизнесийн дүрэм юм. PICT өөрөө энэ эрэмбийг шалгахгүй; харин тухайн дүрмийг баталгаажуулах тусгай тест шаардлагатай.

## Хэсэг B: Execution & Comparison

### 1. Тестийн мөрийн тооны харьцуулалт

| Модель | Тестийн файлын нэр | Нийт мөрийн тоо |
|---|---|---:|
| Browser 2-way | `browser-2way.txt` | 11 (10 тест) |
| Browser 3-way | `browser-3way.txt` | 21 (20 тест) |
| Transfer without constraints | `transfer-nc.txt` | 14 (13 тест) |
| Transfer with constraints | `transfer.txt` | 13 (12 тест) |
| Transfer negative | `transfer-neg.txt` | 17 (16 тест) |

**Тайлбар:** Хаалт доторх тоо нь эхний толгой мөрийг хассан тестийн кейсийн тоо; хүснэгтийн үндсэн тоо нь файл дахь нийт мөрийн тоо. `results/*.txt` файлуудыг UTF-8 кодчиллоор хадгалсан.

`pict ... | tee` ашиглан үүсгэсэн UTF-16 файлыг UTF-8 болгох PowerShell команд:

```powershell
Get-Content -Encoding Unicode results\transfer-neg.txt |
  Set-Content -Encoding UTF8 results\transfer-neg.txt
```

Ижил аргаар бусад `results\*.txt` файлыг хөрвүүлж болно. Энэ commit-д байгаа бүх үр дүнгийн файл аль хэдийн UTF-8 (BOM)-аар хадгалагдсан.

### 2. PICT-ээр үүсгэсэн тестийн кейсүүд

> **Тэмдэглэл:** Гурван кейсийн "Эх мөр" нь `results/transfer-neg.txt`-ийн толгой мөрийн дараах 16 мөрөөс шууд сонгосон. `~` тэмдэглэгээг body-д оруулахгүй; тухайн утга сөрөг oracle сонгоход ашиглагдана. Доорх body нь API-ийн жишиг хэлбэр бөгөөд бодит endpoint-ийн талбарын нэртэй тулгана.

#### Кейс 1: Happy Path (`transfer-neg.txt`-ийн тестийн 1-р мөр, файл дахь 2-р мөр)

- **Эх мөр:** `Valid  Valid  Normal  Same`
- **Transfer body:**
  ```json
  { "from": "ACC-VALID-1", "to": "ACC-VALID-2", "amount": 100, "currency": "MNT" }
  ```
- **Статус + result oracle:** HTTP `200 OK`, `result: SUCCESS`; гүйлгээ бүртгэгдэж, илгээгчээс дүн хасагдаж, хүлээн авагчид нэмэгдэнэ.

#### Кейс 2: Account Frozen (`transfer-neg.txt`-ийн тестийн 12-р мөр, файл дахь 13-р мөр)

- **Эх мөр:** `~Frozen  Valid  Normal  Same` (`~` нь гаралтад угтвартай гарна, body-д хасаж бодит утгыг авна)
- **Transfer body:**
  ```json
  { "from": "ACC-FROZEN", "to": "ACC-VALID-2", "amount": 100, "currency": "MNT" }
  ```
- **Статус + result oracle:** HTTP `403 Forbidden`, `result: ERROR_SENDER_FROZEN`; үлдэгдэл өөрчлөгдөхгүй.

#### Кейс 3: Over Balance (`transfer-neg.txt`-ийн тестийн 6-р мөр, файл дахь 7-р мөр)

- **Эх мөр:** `Valid  Valid  ~OverBalance  Same`
- **Transfer body:**
  ```json
  { "from": "ACC-VALID-1", "to": "ACC-VALID-2", "amount": 999999999, "currency": "MNT" }
  ```
- **Статус + result oracle:** HTTP `422 Unprocessable Entity`, `result: ERROR_INVALID_AMOUNT`; үлдэгдэл өөрчлөгдөхгүй.

**Мөрийн бүтэц (`transfer-neg.txt`, толгойтойгоо 17 мөр):** 2 мөр нь `~`-гүй эерэг мөр (`Valid Valid Normal Same/Different`), үлдсэн 14 мөр нь 7 сөрөг утга (`~Frozen`, `~Missing` (From), `~Missing` (To), `~SameAsFrom`, `~Zero`, `~OverBalance`, `~OverLimit`) тус бүр `Currency = Same/Different` хоёртой хосолсон. Мөр бүрд ганц `~` утга байгаа тул мөр бүр яг нэг `ERROR_*` кодод харгалзана.

### 3. Greedy алгоритмын тайлбар

PICT нь pairwise багцыг greedy (шунахай) heuristic-ээр үүсгэдэг. Эхлээд бүх хүчинтэй хос (pair)-ын жагсаалтыг гаргана. Дараа нь алхам бүрт одоогоор хамрагдаагүй хосуудаас хамгийн олныг нэг дор хамарах тест кейсийг сонгож багцад нэмнэ. Бүх хос хамрагдтал үүнийг давтана.

Энэ арга хурдан боловч хамгийн цөөн мөр өгөхийг баталгаажуулдаггүй. Тиймээс `/r:N` (seed) өөрчлөхөд мөрийн тоо бага зэрэг ялгаатай гарч болно. Лабын тайланд давтагдах үр дүн авахын тулд тогтмол seed (`/r:7`) ашиглахыг зөвлөнө.

### 4. Гурван хувилбарын харьцуулалт

| Хувилбар | Файл | Нийт мөр (толгойтой) | Тест кейс | Happy path мөр | Нэг мөр дэх алдаа |
|---|---|---:|---:|---|---|
| Constraint-гүй | `transfer-nc.txt` | 14 | 13 | 1 (`Valid Valid Normal Different`) | Нэг мөрөнд хэд хэдэн алдаа зэрэг орж болно (ж: `Missing` + `OverLimit`) |
| Constraint-тай | `transfer.txt` | 13 | 12 | 0 | `Missing` үед `Amount = Normal` болох тул зарим давхцал хасагдсан ч `Frozen` + `Missing` зэрэг хослол үлдэнэ |
| Сөрөг (`~`) | `transfer-neg.txt` | 17 | 16 | 2 (`Valid Valid Normal Same/Different`) | Мөр бүрд ганц `~` утга, 14 мөр тус бүр нэг алдаа |

`transfer-neg.txt` нь толгой мөрөөс гадна яг 16 тестийн мөртэй. `transfer-nc.txt` болон `transfer.txt` нь тус бүр 13 болон 12 тестийн мөртэй. Мөрийн тоог шалгах PowerShell команд: `Get-ChildItem results\*.txt | ForEach-Object { [PSCustomObject]@{ File=$_.Name; Lines=(Get-Content -Encoding UTF8 $_.FullName).Count } }`.

### 5. `~` (сөрөг утга) ба constraint

- PICT-ийн `~` нь тухайн утгыг negative value гэж тэмдэглэдэг болохоос constraint биш. Энэ загварт нэг мөрөнд нэг `~` утга гарах байдлаар сөрөг oracle-уудыг тусад нь шалгах боломжтой болсон.
- `~` утгуудыг хооронд нь хослуулахгүй гэсэн дүрэм энэ гаралтад харагдаж байгаа боловч PICT-ийн ерөнхий баталгаа биш; өөр negative model эсвэл seed ашиглахад гаралт өөр байж болно.
- `transfer-neg.model` нь `From: Valid, ~Frozen, ~Missing`, `To: Valid, ~Missing, ~SameAsFrom`, `Amount: Normal, ~Zero, ~OverBalance, ~OverLimit`, `Currency: Same, Different` гэж тодорхойлогдсон. Сөрөг утга нийт 7, тус бүр 2 мөрт орсон тул 7 × 2 = 14 сөрөг мөр, дээр нь 2 эерэг мөр нийлээд 16 мөр болно.
- Энэ загварт `~Missing` (From болон To) мөрүүдэд `Amount = Normal` байна. `transfer-neg.model` дотор constraint бичээгүй тул энэ нь `~`-тэй model-ийн гаралт бөгөөд `transfer.model` дэх `IF` constraint үйлчилснээс болсон гэж дүгнэж болохгүй.
- Иймээс `~` мөрүүдэд constraint хэрэгждэг гэж баталгаатай хэлэхгүй. Constraint-ийг шалгах бол `transfer.model`-ийн эерэг утгатай гаралтыг ашиглах хэрэгтэй; харин `transfer-neg.txt` нь нэг мөрийн нэг алдааны oracle-ийг шалгахад зориулагдана.

## Дүгнэлт ба анализ

Энэхүү лабораторийн ажлаар Microsoft PICT хэрэгслийг ашиглан pairwise combinatorial testing-ийн модель боловсруулж, параметрүүдийн боломжит утгууд болон тэдгээрийн хязгаарлалтыг тодорхойллоо.

`browser` болон `transfer` моделийн тестийн үр дүнг харьцуулснаар pairwise testing нь параметрүүдийн бүх боломжит хослолыг хамруулахын зэрэгцээ тестийн кейсийн тоог бууруулах боломжтойг судлав. `transfer` моделийн хувьд constraint хэрэглэхээс өмнө 72 боломжит комбинац байсан бөгөөд тодорхойлсон хоёр constraint-ийн дагуу 42 хүчинтэй комбинац үлдэнэ.

PICT нь хүчинтэй хослолуудыг хамарсан тестийн багц үүсгэхэд тусалдаг. Энэ нь тест зохиох ажлыг хялбарчилж, олон параметртэй системийн тестийн тоог багасгах боломж олгодог. Гэсэн хэдий ч pairwise testing нь бүх гурвалсан болон түүнээс олон параметрийн харилцан үйлчлэлийг заавал шалгахгүй.

Иймээс өндөр эрсдэлтэй бизнесийн дүрэм, алдааны давуу эрэмбэ, дансны үлдэгдэл болон гүйлгээний лимит зэрэг нөхцөлд нэмэлт тестүүд шаардлагатай. Эцэст нь PICT-ийн бодит гаралт, constraint-ийн зөв хэрэгжилт болон тестийн кейсийн тоог баталгаажуулснаар үр дүнгийн найдвартай байдлыг нэмэгдүүлэх боломжтой.