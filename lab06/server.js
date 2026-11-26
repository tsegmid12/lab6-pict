// Lab06 — Мөнгө шилжүүлэх API (POST /transfer)
// Ажиллуулах: node server.js
const http = require('http');

// In-memory "өгөгдлийн сан"
const accounts = {};   // id -> { balance, currency, frozen, dailyLimit, usedToday }
const transfers = [];  // { id, from, to, amount, currency, timestamp }

// Тогтмол ханш: 1 USD = 3400 MNT
const FX_RATES = {
  USD: { MNT: 3400 },
  MNT: { USD: 1 / 3400 },
};

function convertCurrency(amount, fromCur, toCur) {
  if (fromCur === toCur) return amount;
  if (FX_RATES[fromCur] && FX_RATES[fromCur][toCur]) {
    return amount * FX_RATES[fromCur][toCur];
  }
  return amount;
}

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let data = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      return send(res, 400, { result: 'ERROR_BAD_JSON' });
    }

    const url = req.url.split('?')[0];

    // Setup endpoints — тестийн Initialization-д ашиглана
    let m;
    if (req.method === 'PUT' && (m = url.match(/^\/accounts\/([\w-]+)$/))) {
      const id = m[1];
      accounts[id] = {
        id,
        balance: data.balance !== undefined ? Number(data.balance) : 0,
        currency: data.currency || 'MNT',
        frozen: Boolean(data.frozen),
        dailyLimit: data.dailyLimit !== undefined ? Number(data.dailyLimit) : 1000000,
        usedToday: data.usedToday !== undefined ? Number(data.usedToday) : 0,
      };
      return send(res, 200, { result: 'OK', account: accounts[id] });
    }

    if (req.method === 'GET' && (m = url.match(/^\/accounts\/([\w-]+)$/))) {
      const acc = accounts[m[1]];
      if (!acc) return send(res, 404, { result: 'ERROR_NO_ACCOUNT' });
      return send(res, 200, acc);
    }

    if (req.method === 'GET' && url === '/accounts') {
      return send(res, 200, accounts);
    }

    // Тестлэгдэх гол функц — шилжүүлэг хийх
    // Амжилт: 201 {"result":"OK"} · Оролтын алдаа: 200 {"result":"ERROR_..."}
    // Алдааны шалгах давуу эрэмбэ: from -> to -> amount (<= 0) -> balance -> dailyLimit
    if (req.method === 'POST' && url === '/transfer') {
      const { from, to, amount, currency } = data;

      // 1. from данс байх ёстой
      const fromAcc = accounts[from];
      if (!fromAcc) {
        return send(res, 200, { result: 'ERROR_NO_FROM' });
      }

      // 2. from данс царцаагдаагүй байх ёстой
      if (fromAcc.frozen) {
        return send(res, 200, { result: 'ERROR_FROZEN' });
      }

      // 3. to данс байх ёстой
      const toAcc = accounts[to];
      if (!toAcc) {
        return send(res, 200, { result: 'ERROR_NO_TO' });
      }

      // 4. to данс from-оос өөр байх ёстой
      if (from === to) {
        return send(res, 200, { result: 'ERROR_SAME_ACCOUNT' });
      }

      // 5. amount > 0 байх ёстой
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return send(res, 200, { result: 'ERROR_BAD_AMOUNT' });
      }

      // 6. Валют хөрвүүлэлт
      const txCurrency = currency || fromAcc.currency;
      const amountInFromCur = convertCurrency(numAmount, txCurrency, fromAcc.currency);
      const amountInToCur = convertCurrency(numAmount, txCurrency, toAcc.currency);

      // 7. Дансны үлдэгдлээс хэтрэхгүй байх
      if (amountInFromCur > fromAcc.balance) {
        return send(res, 200, { result: 'ERROR_INSUFFICIENT' });
      }

      // 8. Өдрийн лимитээс хэтрэхгүй байх
      const remainingLimit = fromAcc.dailyLimit - fromAcc.usedToday;
      if (amountInFromCur > remainingLimit) {
        return send(res, 200, { result: 'ERROR_LIMIT' });
      }

      // Бүх нөхцөл биелсэн -> шилжүүлэг амжилттай
      fromAcc.balance -= amountInFromCur;
      fromAcc.usedToday += amountInFromCur;
      toAcc.balance += amountInToCur;

      const txRecord = {
        id: transfers.length + 1,
        from,
        to,
        amount: numAmount,
        currency: txCurrency,
        debited: amountInFromCur,
        credited: amountInToCur,
      };
      transfers.push(txRecord);

      return send(res, 201, { result: 'OK', transferID: txRecord.id });
    }

    if (req.method === 'GET' && url === '/transfers') {
      return send(res, 200, transfers);
    }

    send(res, 404, { result: 'ERROR_NOT_FOUND' });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Шилжүүлгийн API сервер ажиллаж байна: http://localhost:${PORT}`);
});
