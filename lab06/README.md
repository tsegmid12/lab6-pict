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

### B2. Transfer model-ууд

| Файл | Тусгай механизм | Нийт мөр | Happy path | 0 алдаа | 1 алдаа | 2+ алдаа |
|---|---|---:|---:|---:|---:|---:|
| `transfer-nc.model` | Хязгаарлалтгүй | 16 | 1 | 1 | 2 | 13 |
| `transfer.model` | IF хязгаарлалттай | 15 | 1 | 1 | 4 | 10 |
| `transfer-neg.model` | `~` negative утгын тэмдэглэгээ | 18 | 2 | 2 | 16 | 0 |

Алдааны тоог тухайн мөр дэх буруу утгын тоогоор тооцов. `transfer-nc`, `transfer` загварт буруу `From`, буруу `To`, буруу `Amount` утгуудыг тус бүр нэг алдаа гэж үзсэн. Харин `transfer-neg` загварт `~` тэмдэглэгээтэй утга бүрийг нэг negative утга гэж тоолов.

Хязгаарлалтгүй загварт олон алдаа нэг мөрөнд давхцах магадлалтай. Үр дүнгээс харахад 16 мөрийн 13 нь хоёр буюу түүнээс олон алдаатай байна. `transfer.model`-ийн IF нөхцөлүүд зарим буруу хослолыг хассан боловч 15 мөрийн 10 нь олон алдаатай хэвээр байна. `transfer-neg.model`-д 18 мөрийн 16 нь яг нэг negative утгатай, хоёр мөр нь алдаагүй байна.

Эдгээр тоо нь `results/transfer-nc.txt`, `results/transfer.txt`, `results/transfer-neg.txt` файлуудын толгой мөрийг хасаж тоолсон PICT үр дүнд үндэслэсэн. Happy path гэдэгт `Valid, Valid, Normal` утгатай мөрүүдийг тооцов.

### B3. PICT мөрөөс бодит тест кейс

Доорх setup-ууд нь `results/transfer-neg.txt`-ийн бодит мөрүүдтэй
тааруулсан. `DailyUsed` нь хүсэлтийн body-д биш, тестийн орчны setup-д
тохируулна.

| Кейc | PICT мөр (From, To, Amount, Currency, DailyUsed) | Setup | Transfer body | Oracle |
|---|---|---|---|---|
| T01 happy | `Valid, Valid, Normal, Same, Partial` | `A-100` идэвхтэй, 1000 USD; `B-200` идэвхтэй; өдөрт лимитийн хэсгийг ашигласан | `{"from":"A-100","to":"B-200","amount":100,"currency":"USD"}` | 201, `{"result":"OK"}` |
| T02 нэг negative | `Valid, Valid, ~Negative, Same, Partial` | `A-100` идэвхтэй, 1000 USD; `B-200` идэвхтэй; өдөрт лимитийн хэсгийг ашигласан | `{"from":"A-100","to":"B-200","amount":-10,"currency":"USD"}` | 200, `ERROR_BAD_AMOUNT` |
| T03 negative from | `~Frozen, Valid, Normal, Different, Partial` | `A-100` царцаасан; `B-200` идэвхтэй; өдөрт лимитийн хэсгийг ашигласан | `{"from":"A-100","to":"B-200","amount":100,"currency":"USD"}` | 200, `ERROR_FROZEN` |

## 4. Дүгнэлт

Category-partition нь бизнесийн дүрэм, алдааны утга, oracle-ийн давуу эрэмбийг
ил тод бичихэд илүү тохиромжтой.
Төлөөлөх утга сонгохдоо `DailyUsed` шиг body-д харагддаггүй орчны нөхцөлийг
мартахгүй байх нь хамгийн их бодол шаардсан.
Гараар хийсэн A3 хүснэгт нь алдаа бүрийн семантик болон boundary-ийн зорилгыг
уншихад ойлгомжтой хадгалдаг.
PICT нь олон параметрийн pairwise болон 3-way хослолын хамралтыг системтэй
баталгаажуулдаг.
PICT-ийн greedy үр дүн хамгийн цөөн мөрийн баталгаа биш тул мөрийн тоог
шууд “оптимум” гэж тайлбарлаж болохгүй.
Хязгаарлалтгүй transfer model нь олон алдааг нэг мөрөнд хольж, error masking
үүсгэдэг сул талтай.
IF дүрэм нь бодит утгагүй хослолыг хасаж, мөрийн тоог 23-аас 18 болгосон.
`~` negative тэмдэглэгээ нь нэг мөрийн oracle-ийг цэвэр болгоход тустай ч
SINGLE болон далд орчны хязгаарлалтыг орлохгүй.
Иймээс семантик алдаанд category-partition, өргөн хосын хамралтад PICT-ийг
хамтад нь ашиглах нь хамгийн найдвартай сонголт юм.
