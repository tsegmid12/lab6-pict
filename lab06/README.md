**Оюутан:** Э.Цэгмид  
**Оюутны код:** B232270107

# Лаборатори №6 — Category-Partition ба PICT

**Хичээл:** F.CSA313 — Программ хангамжийн чанарын баталгаа ба тест (2026)

## 1. PICT орчин

PICT 3.7.4-ийг эх кодоос `mingw32-make -B pict` командаар бүтээсэн. Эх код болон
build-ийн хавтас энэ репозитороос гадна `C:\Users\tsegm\tools\pict` дотор байна.
Нотолгоо нь [results/pict-build.txt](results/pict-build.txt)-д хадгалагдсан.

## 2. A — Category-Partition

Олон алдаа давхацвал шалгах дарааллыг **from → to → amount** гэж тогтоов.
Ингэснээр буруу `from` байгаа үед дараагийн талбарын алдаа oracle-ийг
бүдгэрүүлэхгүй.

### A1. Сонголт ба төлөөлөх утга

| Category | Сонголт / төлөөлөх утга |
|---|---|
| from | `Valid` — идэвхтэй данс; `Frozen` — царцаасан данс; `Missing` — байхгүй данс |
| to | `Valid` — өөр, байгаа данс; `Missing` — байхгүй данс; `SameAsFrom` — from-той адил |
| amount | `Normal` — энгийн зөв дүн; `EqualBalance` — үлдэгдэлтэй тэнцүү; `EqualLimit` — өдрийн лимиттэй тэнцүү; `Zero`; `Negative`; `OverBalance`; `OverLimit` |
| currency | `Same` — дансны валюттай ижил; `Different` — өөр валют, хөрвүүлэлттэй |
| DailyUsed (далд орчин) | `None` — лимит ашиглаагүй; `Partial` — лимит хэсэгчлэн ашигласан |

`DailyUsed` нь хүсэлтийн body-д байхгүй боловч `OverLimit`, `EqualLimit`
тохиоллыг утгатай болгодог тул тусдаа category болгосон.

### A2. Хязгаарлалт ба тооцоо

| Утга / дүрэм | Тэмдэглэгээ | Үндэслэл |
|---|---|---|
| `Frozen`, `Missing` from | `[ERROR]` | Энэ нөхцөл өөрөө тодорхой алдаа өгнө. |
| `Missing` to, `SameAsFrom` | `[ERROR]` | Хүлээн авагч байхгүй эсвэл from-той ижил байж болохгүй. |
| `Zero`, `Negative`, `OverBalance`, `OverLimit` | `[ERROR]` | Amount-ийн тус бүрийн алдааны ангийг тусгаарлан шалгана. |
| `EqualBalance` | `[SINGLE]` + `[IF]` | Хязгаарын амжилтыг энгийн орчинд нэг удаа шалгана: `Currency=Same`, `DailyUsed=None`. |
| `EqualLimit` | `[SINGLE]` + `[IF]` | Лимитийн яг заагийг нэг удаа шалгана: `Currency=Same`, `DailyUsed=Partial`. |
| `OverLimit` | `[IF]` | Өмнө нь лимит ашигласан үед л энэ төлөөлөгч утгатай: `DailyUsed=Partial`. |
| Алдаатай from/to үед amount | `[IF]` | Error masking-ээс сэргийлж `Amount=Normal` байлгана. |

Хязгаарлалтгүй бүрэн олонлогийн хэмжээ:
`3 × 3 × 7 × 2 × 2 = 252`.

IF дүрмүүдийг хэрэгжүүлсний дараах хүчинтэй комбинацийн тоог дараах байдлаар
тооцно:

- `From=Frozen/Missing`: `2 × 1 × 1 × 2 × 2 = 8` (To зөв, Amount Normal).
- `From=Valid`, `To=Missing/SameAsFrom`: `1 × 2 × 1 × 2 × 2 = 8` (Amount Normal).
- `From=Valid`, `To=Valid`: `4 × 2 × 2 + 1 + 1 + 2 = 20`. Энд Normal/Zero/Negative/OverBalance тус бүр 4, EqualBalance 1, EqualLimit 1, OverLimit 2 боломжтой.

Иймээс нийт `8 + 8 + 20 = 36`, өөрөөр хэлбэл **252 → 36** хүчинтэй
category combination үлдэнэ. Энэ 36 нь бүх боломжит хүчинтэй комбинацийн тоо;
PICT-ийн covering array-ийн гаралтын мөрийн тоотой адил ойлголт биш.

### A3. Спецификацийн хүснэгт

| ID | from | to | amount | currency | DailyUsed | Хүлээгдэх үр дүн |
|---|---|---|---|---|---|---|
| A01 | Valid | Valid | Normal | Same | None | 201 `OK` |
| A02 | Frozen | Valid | Normal | Same | None | 200 `ERROR_FROZEN` |
| A03 | Missing | Valid | Normal | Same | None | 200 `ERROR_NO_FROM` |
| A04 | Valid | Missing | Normal | Same | None | 200 `ERROR_NO_TO` |
| A05 | Valid | SameAsFrom | Normal | Same | None | 200 `ERROR_SAME_ACCOUNT` |
| A06 | Valid | Valid | Zero | Same | None | 200 `ERROR_BAD_AMOUNT` |
| A07 | Valid | Valid | Negative | Same | None | 200 `ERROR_BAD_AMOUNT` |
| A08 | Valid | Valid | OverBalance | Same | None | 200 `ERROR_INSUFFICIENT` |
| A09 | Valid | Valid | OverLimit | Same | Partial | 200 `ERROR_LIMIT` |
| A10 | Valid | Valid | EqualBalance | Same | None | 201 `OK` |
| A11 | Valid | Valid | EqualLimit | Same | Partial | 201 `OK` |
| A12 | Valid | Valid | Normal | Different | None | 201 `OK` (хөрвүүлэлттэй) |
| A13 | Missing | Missing | Zero | Same | None | 200 `ERROR_NO_FROM` (давуу эрэмбэ) |

## 3. B — PICT covering array

### B1. Browser model

`browser.model`-ийг PICT-ийн default 2-way болон `/o:3` 3-way горимоор
ажиллуулсан.

| Model / горим | Бүрэн олонлог | Үр дүнгийн мөр |
|---|---:|---:|
| browser 2-way | 144 | 10 |
| browser 3-way | 144 | 20 |

2-way нь лекцийн гараар хийсэн 9 мөрөөс нэгээр олон гарсан. PICT нь greedy
алгоритм ашигладаг бөгөөд pairwise covering-ийн хамгийн цөөн мөрийг заавал
олох оптимизатор биш. 3-way-ийн 20 мөр нь бүх 144 комбинацийг биш, бүх
гурван параметрийн утгын хослолыг хамарсан covering array юм.

### B2. PICT загваруудын үр дүнгийн харьцуулалт

Гурван өөр PICT загвар ашиглан тестийн хувилбарууд үүсгэж, Happy Path болон бусад тестийн мөрүүдийн тоог харьцуулсан.

**Happy Path шалгуур:** `From = Valid`, `To = Valid`, `Amount = Normal`.

| Файл | Ашигласан арга | Нийт мөр | Happy Path | Other |
|---|---|---:|---:|---:|
| `transfer-nc.txt` | IF constraint ашиглаагүй | 17 | 0 | 17 |
| `transfer.txt` | IF constraint ашигласан | 16 | 0 | 16 |
| `transfer-neg.txt` | Negative testing (`~`) | 30 | 5 | 25 |

**Дүгнэлт:**

- `transfer-nc.txt` нь нэмэлт хязгаарлалтгүйгээр 17 тестийн мөр үүсгэсэн.
- `transfer.txt` нь IF constraint ашигласнаар 16 тестийн мөр үүсгэсэн.
- `transfer-neg.txt` нь `~` тэмдэглэгээг ашиглан сөрөг тестийн утгуудыг шалгаж, нийт 30 тестийн мөр үүсгэсэн. Үүнээс 5 нь Happy Path, 25 нь бусад тестийн хувилбар байна.

Эдгээр үр дүн нь constraint болон negative testing ашиглахад үүсэх тестийн хувилбарын тоо, агуулгын ялгааг харуулж байна.

### B3. PICT мөрөөс бодит тест кейс

Доорх тест кейсүүдийг `results/transfer-neg.txt` файлын бодит мөрүүдээс сонгосон. `Channel` параметр нь шилжүүлгийн сувгийг илэрхийлнэ. Тест ажиллуулах үед тухайн сувгийг хүсэлтийн орчин эсвэл API-ийн дэмждэг сувгийн талбарт тохируулна.

| Кейс | PICT мөр (From, To, Amount, Currency, Channel) | Setup | Transfer body | Oracle |
|---|---|---|---|---|
| T01 happy | `Valid, Valid, Normal, Same, ATM` | `A-100` идэвхтэй, 1000 USD; `B-200` идэвхтэй; шилжүүлгийг ATM сувгаар гүйцэтгэнэ | `{"from":"A-100","to":"B-200","amount":100,"currency":"USD"}` | 201, `{"result":"OK"}` |
| T02 negative amount | `Valid, Valid, ~Negative, Different, Web` | `A-100` идэвхтэй, 1000 USD; `B-200` идэвхтэй; шилжүүлгийг Web сувгаар гүйцэтгэнэ | `{"from":"A-100","to":"B-200","amount":-10,"currency":"EUR"}` | 200, `ERROR_BAD_AMOUNT` |
| T03 negative from | `~Frozen, Valid, Normal, Different, Mobile` | `A-100` царцаасан; `B-200` идэвхтэй; шилжүүлгийг Mobile сувгаар гүйцэтгэнэ | `{"from":"A-100","to":"B-200","amount":100,"currency":"EUR"}` | 200, `ERROR_FROZEN` |

**Тайлбар:**
- T01 нь амжилттай шилжүүлгийн Happy Path кейс.
- T02 нь сөрөг дүнтэй шилжүүлгийн хүсэлтийг шалгана.
- T03 нь царцаасан данснаас шилжүүлэг хийх оролдлогыг шалгана.
- `~` тэмдэглэгээ нь PICT загварт тухайн параметрийн сөрөг тестийн утгыг илэрхийлнэ.
- `Channel`-ийн утгыг бодит API хэрхэн хүлээн авдгаас хамааран request header, body эсвэл тестийн орчны тохиргоонд өгнө.

## 4. Дүгнэлт

Category-partition нь бизнесийн дүрэм, алдааны утга, oracle-ийн давуу эрэмбийг ил тод бичихэд илүү тохиромжтой.

Төлөөлөх утга сонгохдоо `DailyUsed` шиг хүсэлтийн body-д шууд харагддаггүй орчны нөхцөлийг мартахгүй байх нь чухал.

Гараар хийсэн A3 хүснэгт нь алдаа бүрийн семантик болон boundary-ийн зорилгыг уншихад ойлгомжтой хадгалдаг.

PICT нь олон параметрийн pairwise болон 3-way хослолын хамралтыг системтэй үүсгэх, шалгахад тусалдаг. PICT-ийн greedy алгоритмын үр дүн хамгийн цөөн мөрийн баталгаа биш тул мөрийн тоог шууд оптимум гэж тайлбарлаж болохгүй.

Хязгаарлалтгүй `transfer-nc.model` нь олон төрлийн алдааны нөхцөлийг нэг загварт хамруулдаг. IF constraint ашигласан `transfer.model` нь тодорхой нөхцөлд бодит бус параметрийн хослолыг хязгаарладаг.

Энэ лабораторийн одоогийн үр дүнгээр `transfer-nc.txt` 17, `transfer.txt` 16 мөр үүсгэсэн. Эдгээр загварын параметрүүд ялгаатай тул мөрийн тооны зөрүүг зөвхөн IF дүрмийн нөлөө гэж дүгнэж болохгүй.

`~` negative тэмдэглэгээ нь сөрөг тестийн утгуудыг загварчлахад ашиглагдсан. Гэхдээ SINGLE болон далд орчны хязгаарлалтыг орлохгүй.

Иймээс семантик алдаанд Category-Partition, өргөн хосын хамралтад PICT-ийг хамтад нь ашиглах нь тестийн загварчлалын илүү системтэй арга юм.