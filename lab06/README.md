**Оюутан:** Э.Цэгмид  
**Оюутны код:** B232270107  
**Хичээл:** F.CSA313 — Программ хангамжийн чанарын баталгаа ба тест (2026)

# Лаборатори №6 — Category-Partition ба PICT

## 1. PICT орчин

Энэхүү лабораторийн ажлаар Microsoft PICT (Pairwise Independent Combinatorial Testing) хэрэгслийг ашиглан Category-Partition болон Combinatorial Testing аргаар тестийн хувилбарууд үүсгэв.

- **PICT хувилбар:** 3.7.4
- **Build команд:** `mingw32-make -B pict`
- **Build орчин:** MinGW
- **Build нотолгоо:** `results/pict-build.txt`

PICT-ийн эх код болон build-ийн хавтас нь repository-оос гадна байрлана.

## 2. A — Category-Partition

### A1. Category болон сонголтууд

Мөнгө шилжүүлэх үйлдлийн оролтууд болон орчны нөхцөлийг дараах category-уудаар тодорхойлов.

| Category | Сонголт | Тайлбар |
|---|---|---|
| From | Valid | Идэвхтэй, шилжүүлэг хийх боломжтой данс |
| From | Frozen | Царцаасан данс |
| From | Missing | Системд байхгүй данс |
| To | Valid | Байгаа, өөр данс |
| To | Missing | Системд байхгүй хүлээн авагч |
| To | SameAsFrom | Илгээгчтэй ижил данс |
| Amount | Normal | Энгийн зөв дүн |
| Amount | Zero | 0 дүн |
| Amount | Negative | Сөрөг дүн |
| Amount | OverBalance | Дансны үлдэгдлээс их дүн |
| Amount | OverLimit | Өдрийн лимитээс их дүн |
| Currency | Same | Дансны валюттай ижил |
| Currency | Different | Дансны валютаас өөр |
| DailyUsed | None | Өдрийн лимитээс өмнө ашиглаагүй |
| DailyUsed | Partial | Өдрийн лимитийн тодорхой хэсгийг ашигласан |

**Category сонгосон үндэслэл:**

- `From` нь шилжүүлэг эхлүүлэх дансны төлөвийг шалгана.
- `To` нь хүлээн авагчийн данс зөв эсэх болон өөрийн данс руу шилжүүлэх оролдлогыг шалгана.
- `Amount` нь зөв дүн, тэг, сөрөг, үлдэгдэл болон лимитээс хэтэрсэн нөхцөлүүдийг хамарна.
- `Currency` нь ижил болон өөр валюттай шилжүүлгийг ялгана.
- `DailyUsed` нь өдрийн лимитийн ашиглалтаас хамаарах орчны нөхцөлийг илэрхийлнэ.

### A2. Constraint болон комбинацийн тооцоо

`transfer.model` файлд дараах IF constraint-үүдийг тодорхойлсон.

```text
IF [From] <> "Valid" THEN [Amount] = "Normal";
IF [To] <> "Valid" THEN [Amount] = "Normal";
IF [Amount] = "OverLimit" THEN [DailyUsed] = "Partial";
```

Constraint-ийн тайлбар:

| Constraint | Үндэслэл |
|---|---|
| From ≠ Valid → Amount = Normal | Илгээгчийн данс хүчинтэй биш үед Amount-ийг Normal байлгана |
| To ≠ Valid → Amount = Normal | Хүлээн авагчийн данс хүчинтэй биш үед Amount-ийг Normal байлгана |
| Amount = OverLimit → DailyUsed = Partial | Өдрийн лимитээс хэтэрсэн дүнг шалгах үед DailyUsed = Partial байна |

**Constraint-ээс өмнөх комбинацийн тоо**

- From — 3 утга
- To — 3 утга
- Amount — 5 утга
- Currency — 2 утга
- DailyUsed — 2 утга

\[
3 \times 3 \times 5 \times 2 \times 2 = 180
\]

**Constraint-ийн дараах хүчинтэй комбинацийн тоо**

1. From = Frozen эсвэл Missing үед Amount = Normal:

\[
2 \times 3 \times 1 \times 2 \times 2 = 24
\]

2. From = Valid, To = Missing эсвэл SameAsFrom үед Amount = Normal:

\[
1 \times 2 \times 1 \times 2 \times 2 = 8
\]

3. From = Valid, To = Valid үед Amount-ийн бүх утгыг ашиглана. OverLimit үед DailyUsed = Partial байна:

\[
1 \times 1 \times (4 \times 2 + 1 \times 1) \times 2 = 18
\]

Нийт:

\[
24 + 8 + 18 = 50
\]

Иймээс constraint хэрэгжүүлсний дараа 180 боломжит комбинациас 50 хүчинтэй комбинаци үлдэнэ.

> 50 нь бүх хүчинтэй комбинацийн тоо бөгөөд PICT-ийн covering array-аар үүсгэсэн тестийн мөрийн тоо биш.

### A3. Гараар тодорхойлсон тест кейсүүд

| ID | From | To | Amount | Currency | DailyUsed | Хүлээгдэх үр дүн |
|---|---|---|---|---|---|---|
| A01 | Valid | Valid | Normal | Same | None | Амжилттай шилжүүлэг |
| A02 | Frozen | Valid | Normal | Same | None | Илгээгч царцаасан алдаа |
| A03 | Missing | Valid | Normal | Same | None | Илгээгчийн данс олдохгүй |
| A04 | Valid | Missing | Normal | Same | None | Хүлээн авагч олдохгүй |
| A05 | Valid | SameAsFrom | Normal | Same | None | Ижил дансны алдаа |
| A06 | Valid | Valid | Zero | Same | None | Дүн тэг байх алдаа |
| A07 | Valid | Valid | Negative | Same | None | Сөрөг дүнгийн алдаа |
| A08 | Valid | Valid | OverBalance | Same | None | Үлдэгдэл хүрэлцэхгүй |
| A09 | Valid | Valid | OverLimit | Same | Partial | Өдрийн лимит хэтэрсэн |
| A10 | Valid | Valid | EqualBalance | Same | None | Үлдэгдэлтэй тэнцүү дүнгийн boundary |
| A11 | Valid | Valid | EqualLimit | Same | Partial | Лимиттэй тэнцүү дүнгийн boundary |
| A12 | Valid | Valid | Normal | Different | None | Валют хөрвүүлэлттэй шилжүүлэг |
| A13 | Missing | Missing | Normal | Same | None | From алдааны давуу эрэмбэ |

**Тайлбар:** A10 болон A11 нь гараар тодорхойлсон нэмэлт boundary тестүүд. `EqualBalance`, `EqualLimit` утгууд одоогийн `transfer.model` файлд байхгүй тул эдгээр нь PICT-ээр үүсгэсэн тест биш.

A13 тестийн Amount-ийг `Normal` гэж зассан. Учир нь `transfer.model`-ийн IF constraint-ийн дагуу From эсвэл To хүчинтэй биш үед Amount = Normal байх ёстой.

Олон алдаа зэрэг үүссэн тохиолдолд `From → To → Amount` гэсэн шалгах дарааллыг ашиглан аль алдаа түрүүлж илрэхийг тодорхойлов.

## 3. B — PICT ашиглан Combinatorial Testing хийх

### B1. Browser model — 2-way болон 3-way testing

Browser-ийн тохиргооны параметрүүдийг `browser.model` файлд тодорхойлж, PICT ашиглан 2-way болон 3-way covering array үүсгэв.

Параметрүүд:

- Content: Allow, Restrict, Block
- Cookies: Allow, Restrict, Block
- Popups: Yes, No
- Addons: Yes, No
- Attacks: Yes, No
- Forgeries: Yes, No

Бүрэн комбинацийн тоо:

\[
3 \times 3 \times 2 \times 2 \times 2 \times 2 = 144
\]

| Тестийн төрөл | Бүрэн комбинаци | PICT-ийн үүсгэсэн мөр |
|---|---:|---:|
| 2-way | 144 | 10 |
| 3-way | 144 | 20 |

2-way testing нь параметрүүдийн бүх боломжит хос утгын хослолыг хамруулах зорилготой.

3-way testing нь гурван параметрийн бүх боломжит утгын хослолыг хамруулах зорилготой.

Үр дүнгийн файлууд:

- `results/browser-2way.txt`
- `results/browser-3way.txt`

### B2. Transfer model-уудын үр дүнгийн харьцуулалт

Мөнгө шилжүүлэх үйлдлийн хувьд гурван өөр PICT model үүсгэн, constraint болон negative testing-ийн үр дүнг харьцуулав.

**Happy Path шалгуур:**

- From = Valid
- To = Valid
- Amount = Normal

| Үр дүнгийн файл | Арга | Нийт мөр | Happy Path | Бусад мөр |
|---|---|---:|---:|---:|
| `transfer-nc.txt` | IF constraint ашиглаагүй | 17 | 0 | 17 |
| `transfer.txt` | IF constraint ашигласан | 16 | 0 | 16 |
| `transfer-neg.txt` | Negative testing (`~`) | 30 | 5 | 25 |

**Үр дүнгийн тайлбар:**

1. `transfer-nc.model` нь нэмэлт IF constraint-гүйгээр тестийн хувилбарууд үүсгэсэн.
2. `transfer.model` нь IF нөхцөлөөр зарим комбинацийг хязгаарласан.
3. `transfer-neg.model` нь `~` тэмдэглэгээг ашиглан сөрөг тестийн нөхцөлүүдийг тодорхойлсон.
4. `transfer-neg.txt` файлд 5 Happy Path болон 25 бусад тестийн мөр байна.

Эдгээр model-ийн параметрүүд бүрэн ижил биш тул мөрийн тооны ялгааг зөвхөн IF constraint-ийн нөлөө гэж дүгнэхгүй.

Үр дүнгийн файлууд:

- `results/transfer-nc.txt`
- `results/transfer.txt`
- `results/transfer-neg.txt`

### B3. PICT мөрөөс тест кейс болон Oracle тодорхойлох

`results/transfer-neg.txt` файлын бодит мөрүүдээс гурван тест кейс сонгов.

#### B3.1. Сонгосон PICT тест кейсүүд

| Test ID | PICT мөр | Файл дахь мөр | Зорилго |
|---|---|---:|---|
| T01 | `Valid, Valid, Normal, Same, ATM` | 2 | Happy Path |
| T02 | `Valid, Valid, ~Negative, Different, Web` | 11 | Сөрөг дүнгийн шалгалт |
| T03 | `~Frozen, Valid, Normal, Different, Mobile` | 7 | Царцаасан дансны шалгалт |

#### B3.2. Test setup

| Test ID | Setup | Request-ийн үндсэн нөхцөл |
|---|---|---|
| T01 | Илгээгч болон хүлээн авагч идэвхтэй, үлдэгдэл хүрэлцээтэй | Эерэг, зөв дүнтэй шилжүүлэг |
| T02 | Хоёр данс идэвхтэй, илгээгчийн үлдэгдэл хүрэлцээтэй | Сөрөг дүнтэй шилжүүлгийн хүсэлт |
| T03 | Илгээгч царцаасан, хүлээн авагч идэвхтэй | Царцаасан данснаас шилжүүлэх хүсэлт |

`Channel` нь `transfer-neg.model`-д байгаа PICT параметр. Энэ утгыг API-ийн request body эсвэл header-т дамжуулах шаардлагатай гэж үзээгүй. Бодит API дэмждэг эсэхийг эх кодоос шалгах шаардлагатай.

#### B3.3. Oracle симуляци

Доорх хүснэгт нь бодит API-аас авсан хариу биш, харин тестийн шаардлагад тулгуурласан **загварчилсан Oracle** юм. Жишээ статус болон response body нь API-ийн бодит хэрэгжүүлэлтээс хамаарч өөр байж болно.

| Test ID | Симуляцийн HTTP статус | Симуляцийн үр дүн | Хүлээгдэх дансны өөрчлөлт |
|---|---:|---|---|
| T01 | 200 OK | Шилжүүлэг амжилттай | Илгээгчийн үлдэгдэл буурч, хүлээн авагчийн үлдэгдэл нэмэгдэнэ |
| T02 | 400 Bad Request | Сөрөг дүнг хориглоно | Хоёр дансны үлдэгдэл өөрчлөгдөхгүй |
| T03 | 403 Forbidden | Царцаасан данснаас шилжүүлэхийг хориглоно | Хоёр дансны үлдэгдэл өөрчлөгдөхгүй |

**Загварчилсан response body**

T01 — Амжилттай шилжүүлэг:

```json
{
  "success": true,
  "message": "Transfer successful"
}
```

T02 — Сөрөг дүн:

```json
{
  "success": false,
  "message": "Amount must be greater than zero"
}
```

T03 — Царцаасан данс:

```json
{
  "success": false,
  "message": "Sender account is frozen"
}
```

**Oracle шалгах шалгуур:**

1. HTTP status нь тухайн тестийн хүлээгдэж буй үр дүнтэй нийцэх.
2. Response body нь амжилт эсвэл алдааны мэдээллийг зөв илэрхийлэх.
3. Амжилттай шилжүүлгийн үед илгээгчийн үлдэгдэл буурч, хүлээн авагчийн үлдэгдэл нэмэгдэх.
4. Амжилтгүй шилжүүлгийн үед хоёр дансны үлдэгдэл өөрчлөгдөхгүй байх.

**Баталгаажуулалтын төлөв:** Эдгээр нь симуляцийн жишээ бөгөөд бодит API-ийн HTTP status, response body, дансны үлдэгдлийг Postman-аар шалгаж баталгаажуулах шаардлагатай.

### B3.4. Гараар болон PICT-ээр үүсгэсэн тестийн харьцуулалт

| Шалгуур | Гараар тодорхойлсон A3 | PICT-ээр үүсгэсэн |
|---|---|---|
| Тест үүсгэх арга | Category-Partition | Combinatorial Testing |
| Тестийн сонголт | Бизнес дүрэмд тулгуурласан | Model болон constraint-д тулгуурласан |
| Үндсэн зорилго | Чухал нөхцөл, boundary болон алдааг шалгах | Параметрүүдийн хослолын хамралтыг нэмэгдүүлэх |
| Boundary testing | EqualBalance, EqualLimit | Model-д тодорхойлсон утгуудаас хамаарна |
| Давуу тал | Тестийн зорилго ойлгомжтой | Олон параметрийн хослолыг системтэй үүсгэнэ |
| Сул тал | Гараар сонгоход цаг их орно | Бизнесийн бүх дүрэм, boundary нөхцөлийг автоматаар ойлгохгүй |

**Тест кейсийн харьцуулалт**

| Тестийн нөхцөл | A3 тест | PICT тест | Үр дүн |
|---|---|---|---|
| Амжилттай шилжүүлэг | A01 | T01 | Happy Path давхцана |
| Царцаасан данс | A02 | T03 | From-ийн алдаатай нөхцөл |
| Сөрөг дүн | A07 | T02 | Amount-ийн сөрөг утга |
| Валютын зөрүү | A12 | T02, T03 | Different утга орсон боловч амжилттай хөрвүүлэлтийг батлахгүй |
| Үлдэгдэлтэй тэнцүү дүн | A10 | Сонгосон B3 мөрүүдэд байхгүй | A3-ийн нэмэлт boundary тест |
| Лимиттэй тэнцүү дүн | A11 | Сонгосон B3 мөрүүдэд байхгүй | A3-ийн нэмэлт boundary тест |

**Дүгнэлт**

A3 нь бизнесийн шаардлагад үндэслэн Happy Path, сөрөг нөхцөл болон boundary утгуудыг зориудаар сонгох боломж олгодог. Харин PICT нь олон параметрийн хослолыг системтэй үүсгэж, гараар сонгоход орхигдож болох нөхцөлүүдийг хамруулахад тусалдаг.

Сонгосон B3 тестүүд нь A3-ийн амжилттай шилжүүлэг, сөрөг дүн, царцаасан дансны нөхцөлүүдтэй давхцаж байна. Гэхдээ EqualBalance болон EqualLimit зэрэг boundary нөхцөлүүдийг сонгосон гурван PICT тест дангаараа хамрахгүй.

Иймээс Category-Partition болон PICT аргыг хамтад нь ашиглах нь илүү үр дүнтэй.

## 4. Ерөнхий дүгнэлт

Энэхүү лабораторийн ажлаар Category-Partition аргаар мөнгө шилжүүлэх үйлдлийн category болон сонголтуудыг тодорхойлж, PICT ашиглан pairwise болон 3-way тестийн хувилбарууд үүсгэв.

Browser model-ийн хувьд 2-way testing-ээр 10, 3-way testing-ээр 20 мөр үүсгэсэн. Transfer model-уудын хувьд constraint-гүй, constraint-тэй болон negative testing аргуудыг харьцуулсан.

Мөн PICT-ийн бодит мөрүүдээс гурван тест кейс сонгож, тэдгээрийн Oracle болон хүлээгдэх үр дүнг тодорхойлов. Oracle-ийн жишээг симуляци хэлбэрээр үзүүлсэн бөгөөд бодит API-ийн үр дүнгээр баталгаажуулах шаардлагатай.

Category-Partition нь чухал бизнес дүрэм, boundary нөхцөлийг тодорхойлж, PICT нь олон параметрийн хослолын хамралтыг нэмэгдүүлдэг болохыг энэ лабораторийн ажлаар судаллаа.