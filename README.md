# Lab 6: Pairwise Testing with PICT

**Оюутан:** Э.Цэгмид
**Оюутны код:** B232270107

## Хэсэг А: Model Design

### 1. Сонголт ба Утгын хүснэгт (Selection/Value Table)

| Параметр | Утгууд (Values) | Тайлбар |
| :--- | :--- | :--- |
| **From** | Valid, Frozen, Missing | Дансны төлөв |
| **To** | Valid, Missing, SameAsFrom | Хүлээн авагчийн төлөв |
| **Amount** | Zero, Normal, OverBalance, OverLimit | Гүйлгээний дүн |
| **Currency** | Same, Different | Валют |

### 2. Хязгаарлалтууд (Constraints) ба Үндэслэл

Дараах хязгаарлалтуудыг модельд оруулсан:
- `IF [From] = "Missing" THEN [Amount] = "Normal";`
- `IF [To] = "Missing" THEN [Amount] = "Normal";`

**Үндэслэл:** Хэрэв данс алга (Missing) бол гүйлгээний дүн нь ердийн (Normal) утгатай байх ёстой, учир нь алга болох төлөв нь дүнгийн хязгаарлалттай холбогдохгүй.

### 3. Тооцоолол (N $\to$ M)
- **Нийт боломжит нэгдлүүд (N):** $3 (\text{From}) \times 3 (\text{To}) \times 4 (\text{Amount}) \times 2 (\text{Currency}) = 72$
- **PICT-ийн гаргасан тест кейсүүд (M):** Модель бүрээс хамаарч 14-22 кейс гарсан (Жишээ нь: `transfer.model` $\to$ 14 кейс).
- **Бууралтын хувь:** $\approx 80\%$ бууралт.

### 4. Спецификацийн хүснэгт (Test Specifications)

| ID | From | To | Amount | Currency | Төрөл / Хүлээгдэх үр дүн |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Valid | Valid | Normal | Same | Happy Path $\to$ Амжилттай |
| 2 | Frozen | Valid | Normal | Same | Error: Account Frozen $\to$ Алдаа |
| 3 | Valid | Missing | Normal | Same | Error: Recipient Missing $\to$ Алдаа |
| 4 | Valid | Valid | OverBalance | Same | Error: Insufficient Funds $\to$ Алдаа |
| 5 | Valid | Valid | OverLimit | Same | Error: Limit Exceeded $\to$ Алдаа |
| 6 | Valid | Valid | Zero | Same | Error: Invalid Amount $\to$ Алдаа |
| 7 | Valid | Valid | Normal | Different | Currency Conversion $\to$ Амжилттай |
| 8 | Frozen | Missing | Normal | Different | Priority Error: Account Frozen $\to$ Алдаа |
| 9 | Missing | Valid | Normal | Same | Error: Sender Missing $\to$ Алдаа |
| 10 | Valid | SameAsFrom | Normal | Same | Compound: Same Account Transfer $\to$ Алдаа |

**Алдааны давуу эрэмбэ:**
1. Sender Missing/Frozen $\to$ 2. Recipient Missing $\to$ 3. Amount Issues $\to$ 4. Currency Issues.

## Хэсэг B: Execution & Comparison

### 1. Мөрийн тооны харьцуулалт

| Модель | Мөрийн тоо (Line Count) |
| :--- | :---: |
| `browser-2way` | 11 |
| `browser-3way` | 21 |
| `transfer-nc` | 14 |
| `transfer` | 14 |
| `transfer-neg` | 17 |

### 2. Бодит Тест Кейсүүд (Derived from PICT)

**Кейс 1: Happy Path**
- **Setup:** Sender болон Recipient-ийн данс валид, дүн нь хэвийн.
- **Input:** From=Valid, To=Valid, Amount=Normal, Currency=Same.
- **Oracle:** Гүйлгээ амжилттай бүртгэгдэх.

**Кейс 2: Account Frozen (from transfer-neg)**
- **Setup:** Илгээгчийн данс нь хөлдөөгдсөн (Frozen).
- **Input:** From=Frozen, To=Valid, Amount=Normal, Currency=Same.
- **Oracle:** "Error: Source account is frozen" гэсэн алдаа заана.

**Кейс 3: Over Balance**
- **Setup:** Илгээгчийн дансны үлдэгдэл гүйлгээний дүнгээс бага.
- **Input:** From=Valid, To=Valid, Amount=OverBalance, Currency=Same.
- **Oracle:** "Error: Insufficient funds" гэсэн алдаа заана.

## Дүгнэлт ба Анализ

PICT хэрэгсэл нь "Greedy" алгоритмыг ашиглан параметрүүдийн хослолыг хамгийн бага тоогоор бүрхэж,Pairwise coverage-ийг хангадаг. Энэхүү алгоритм нь тест кейс бүрийг үүсгэхдээ хамгийн олон шинэ хослолыг нэмж буй утгыг сонгож, нийт кейсийн тоог эрс багасгадаг. Миний хийсэн туршилтын үр дүнд 72 боломжит нэгдлийг ердөө 14-22 тест кейсээр бүрхэж чадсанаас үзэхэд Pairwise арга нь тестийн хугацааг хэмнэх болон үр ашгийг нэмэгдүүлэхэд маш үр дүнтэй болохыг харууллаа.
