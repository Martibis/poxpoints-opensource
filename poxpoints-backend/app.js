const express = require("express");
const app = express();
var cors = require("cors");
const rateLimit = require("express-rate-limit");

//app.options("*", cors({}));
/* app.use(
  cors({
    origin: "https://poxpoints.com",
    credentials: true,
  })
); */
/* app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  //res.header('Content-Type', 'application/json');
  next();
}); */
const mysql = require("mysql");
const morgan = require("morgan");
const helmet = require("helmet");
const request = require("request");
const puppeteer = require("puppeteer");
const cron = require("node-cron");

const paypal = require("@paypal/checkout-server-sdk");
let http = require("http").Server(app);

const {
  httpPort,
  httpsPort,
  host,
  dbUser,
  password,
  database,
  limiterMax,
  poxPw,
  poxUser,
  clientId,
  ppClient,
  ppSecret,
  quickPw
} = require("./config");

let environment = new paypal.core.LiveEnvironment(ppClient, ppSecret);
//let environment = new paypal.core.SandboxEnvironment(ppClient || 'PAYPAL-SANDBOX-CLIENT-ID', ppSecret || 'PAYPAL-SANDBOX-CLIENT-SECRET');
let paypalClient = new paypal.core.PayPalHttpClient(environment);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: limiterMax, // limit each IP to 2000 requests per windowMs
});

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(clientId);

app.use(limiter);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
/* app.options("*", cors()); */

app.use(morgan("short"));

const connection = mysql.createConnection({
  host: host,
  user: dbUser,
  password: password,
  database: database,
  multipleStatements: true,
  charset: "utf8mb4",
});

//TODO UNCOMMENT FOR ONE OF THE NODE SERVERS (NOT ON ALL AS IT CAUSES THE CALL TO BE DONE MULTIPLE TIMES)
cron.schedule("0 0 * * 0", async () => {
  console.log("Updating prices");
  const queryString =
    "UPDATE champs SET price = (ROUND((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.02 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity = 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE spells SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.02 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity = 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE relics SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.02 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity = 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE equips SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.02 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity = 'LIMITED' AND stock = 0 AND price < 10000000;";
  connection.query(queryString, [], (err3, res3, fields3) => {
    if (err3) {
      console.log(err3);
      return;
    }
  });
});

cron.schedule("0 0 * * 0", async () => {
  console.log("Updating prices");
  const queryString =
    "UPDATE champs SET price = (ROUND((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.01 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity != 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE spells SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.01 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity != 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE relics SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.01 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity != 'LIMITED' AND stock = 0 AND price < 10000000; UPDATE equips SET price = (CEIL((price * CASE WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) <= 20 THEN ((datediff(CURRENT_TIMESTAMP, lastin) * 0) + 1)  WHEN ((datediff(CURRENT_TIMESTAMP, lastin) * 1) + 1) > 20 THEN 1.01 END  )/ ( (POWER(10, FLOOR(LOG(10, price))) )/100) ) * ( (POWER(10, FLOOR(LOG(10, price))) )/100)) WHERE datediff(CURRENT_TIMESTAMP, lastin) > 0 AND rarity != 'LIMITED' AND stock = 0 AND price < 10000000;";
  connection.query(queryString, [], (err3, res3, fields3) => {
    if (err3) {
      console.log(err3);
      return;
    }
  });
});

cron.schedule("0 0 * * *", async () => {
  console.log("Updating carts");
  const queryString2 =
    "SELECT * FROM Poxpoints.carts WHERE datediff(current_timestamp, addedon) > 0;";
  connection.query(queryString2, [], (err4, res4, fields4) => {
    if (err4) {
      console.log(err4);
      return;
    } else {
      for (let i = 0; i < res4.length; i++) {
        let type = res4[i].type;
        let cartsid = res4[i].idcarts;
        let baseid = res4[i].baseid;
        let inorout;
        if (res4[i].changetobalance > 0) {
          inorout = 1;
        } else {
          inorout = -1;
        }
        console.log(type, cartsid, baseid, inorout);
        let idText = "";
        let typeText = "";
        let tableText = "";

        switch (parseInt(type)) {
          case 1:
            idText = " basechampid ";
            typeText = "1";
            tableText = "champs";
            break;
          case 3:
            idText = " baseequipid ";
            typeText = "3";
            tableText = "equips";
            break;
          case 4:
            idText = " baserelicid ";
            typeText = "4";
            tableText = "relics";
            break;
          case 2:
            idText = " basespellid ";
            typeText = "2";
            tableText = "spells";
            break;
          default:
            idText = " basechampid ";
            typeText = "1";
            tableText = "champs";
        }

        let columnToUpdate = "";
        switch (parseInt(inorout)) {
          case -1:
            const queryString3 = "DELETE FROM carts WHERE idcarts = ?";
            connection.query(queryString3, [cartsid], (err4, res4, fields4) => {
              if (err4) {
                console.log(err4);
                return;
              } else {
                let rows = res4.affectedRows;
                if (rows > 0) {
                  const queryString5 =
                    "UPDATE " +
                    tableText +
                    " SET availablestock = availablestock + 1 WHERE " +
                    idText +
                    "= ?;";
                  connection.query(
                    queryString5,
                    [baseid],
                    (err6, res6, fields6) => {
                      if (err6) {
                        console.log(err6);
                        return;
                      }
                    }
                  );
                }
              }
            });

            break;
          case 1:
            const queryString8 = "DELETE FROM carts WHERE idcarts = ?";
            connection.query(queryString8, [cartsid], (err9, res9, fields9) => {
              if (err9) {
                console.log(err9);
                return;
              } else {
                let rows = res9.affectedRows;
                if (rows > 0) {
                  const queryString10 =
                    "UPDATE " +
                    tableText +
                    " SET potentialstock = potentialstock - 1 WHERE " +
                    idText +
                    "= ?;";
                  connection.query(
                    queryString10,
                    [baseid],
                    (err11, res11, fields11) => {
                      if (err11) {
                        console.log(err11);
                        return;
                      }
                    }
                  );
                }
              }
            });
            break;
        }
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("And we are in!");
});

app.post("/create_transaction", async (req, res) => {
  const token = req.body.token;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;
  console.log(email);

  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    let usd = parseFloat(req.body.usd) + 0.5;
    usd = usd.toString();
    console.log("Total value:" + usd.toString());
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: usd,
          },
        },
      ],
    });

    let order;
    try {
      order = await paypalClient.execute(request);
    } catch (err) {
      // 4. Handle any errors from the call
      console.error(err);
      res.status(500);
      return;
    }

    // 5. Return a successful response to the client with the order ID
    console.log(order.result);
    res.status(200).json({
      orderID: order.result.id,
    });
  } else {
    res.status(500);
  }
});

app.post("/buy_pp", async (req, res) => {
  const orderID = req.body.orderID;
  const token = req.body.token;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;
  console.log(email);

  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    // 3. Call PayPal to get the transaction details
    let request = new paypal.orders.OrdersCaptureRequest(orderID);

    let capture;
    let captureID;
    let usdValue;
    let status;
    try {
      capture = await paypalClient.execute(request);
      captureID = capture.result.purchase_units[0].payments.captures[0].id;
      status = capture.result.status;
      usdValue =
        parseFloat(
          capture.result.purchase_units[0].payments.captures[0].amount.value
        ) - 0.5;
    } catch (err) {
      // 4. Handle any errors from the call
      console.error(err);
      res.status(500);
      return;
    }
    let points = usdValue * 100000;
    if (status == "COMPLETED") {
      const queryString2 =
        "INSERT into paypal (idpaypal, usd, points) VALUES (?, ?, ?);";
      connection.query(
        queryString2,
        [captureID, usdValue, points],
        (err3, res3, fields3) => {
          if (err3) {
            console.log(err3);
            res.status(500);
          } else {
            const queryString5 =
              "UPDATE users SET points = points + ? WHERE email = ?;";
            connection.query(
              queryString5,
              [points, email],
              (err5, res5, fields5) => {
                if (err5) {
                  console.log(err5);
                  res.status(500);
                } else {
                  res.status(200).json(res5);
                }
              }
            );
          }
        }
      );
    } else {
      res.status(500);
    }
  } else {
    res.status(500);
  }
});

app.post("/signin", async (req, res) => {
  const token = req.body.token;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;
  console.log(email);
  //const userid = payload['sub'];
  //console.log(payload);
  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    //If user doesn't exist make here, return points
    const queryString1 =
      "INSERT IGNORE INTO users (email, points) VALUES (?, ?)";
    connection.query(queryString1, [email, 0], (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        res.end();
        return;
      } else {
        const queryString2 = "SELECT * FROM users WHERE email = ?";
        connection.query(queryString2, [email], (err3, res3, fields3) => {
          if (err3) {
            console.log(err3);
            res.end();
          } else {
            res.json(res3);
          }
        });
      }
    });
  } else {
    //problem
    res.json("Error singing in!");
  }
});

function factionId(f) {
  switch (f) {
    case "Forsaken Wastes":
      return 1;
      break;
    case "Underdepths":
      return 2;
      break;
    case "Sundered Lands":
      return 3;
      break;
    case "Shattered Peaks":
      return 4;
      break;
    case "Forglar Swamp":
      return 5;
      break;
    case "Ironfist Stronghold":
      return 6;
      break;
    case "K'thir Forest":
      return 7;
      break;
    case "Savage Tundra":
      return 8;
      break;
  }
}

app.post("/user_stock", async (req, res) => {
  const user = req.body.user;
  const pw = req.body.pw;
  let browser = await puppeteer.launch({
    headless: false,
    args: ["--proxy-server='direct://'", "--proxy-bypass-list=*"],
  });
  let page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);

  await page.setCacheEnabled(false);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
  );

  await page.goto("https://www.poxnora.com/security/login.do", {
    waitUntil: "networkidle2",
  });
  await page.type("#username", user, { delay: 0 });
  await page.type("#password", pw, { delay: 0 });
  await page.click('button[type="submit"]');
  let urlToCheck = page.url();
  if (urlToCheck == "https://www.poxnora.com/index.do") {
    await page.goto("https://www.poxnora.com/runes/load-forge.do?m=checklist");
    const jsonString = await page.evaluate(() => document.body.innerHTML);
    const allData = JSON.parse(jsonString);
    console.log(allData);
    res.json(allData);
  } else {
    //WRONG ACCOUNT INFO
    console.log("Wrong username or pw");
    res.end();
  }
});

app.post("/update_stock", async (req, res) => {
  const pw = req.body.pw;
  if (pw == quickPw) {
    const queryString2 = "SELECT * FROM Poxpoints.carts;";
    connection.query(queryString2, [], (err4, res4, fields4) => {
      if (err4) {
        console.log(err4);
        return;
      } else {
        for (let i = 0; i < res4.length; i++) {
          let type = res4[i].type;
          let cartsid = res4[i].idcarts;
          let baseid = res4[i].baseid;
          let inorout;
          if (res4[i].changetobalance > 0) {
            inorout = 1;
          } else {
            inorout = -1;
          }
          console.log(type, cartsid, baseid, inorout);
          let idText = "";
          let typeText = "";
          let tableText = "";

          switch (parseInt(type)) {
            case 1:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
              break;
            case 3:
              idText = " baseequipid ";
              typeText = "3";
              tableText = "equips";
              break;
            case 4:
              idText = " baserelicid ";
              typeText = "4";
              tableText = "relics";
              break;
            case 2:
              idText = " basespellid ";
              typeText = "2";
              tableText = "spells";
              break;
            default:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
          }

          let columnToUpdate = "";
          switch (parseInt(inorout)) {
            case -1:
              const queryString3 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString3,
                [cartsid],
                (err4, res4, fields4) => {
                  if (err4) {
                    console.log(err4);
                    return;
                  } else {
                    let rows = res4.affectedRows;
                    if (rows > 0) {
                      const queryString5 =
                        "UPDATE " +
                        tableText +
                        " SET availablestock = availablestock + 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString5,
                        [baseid],
                        (err6, res6, fields6) => {
                          if (err6) {
                            console.log(err6);
                            return;
                          }
                        }
                      );
                    }
                  }
                }
              );

              break;
            case 1:
              const queryString8 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString8,
                [cartsid],
                (err9, res9, fields9) => {
                  if (err9) {
                    console.log(err9);
                    return;
                  } else {
                    let rows = res9.affectedRows;
                    if (rows > 0) {
                      const queryString10 =
                        "UPDATE " +
                        tableText +
                        " SET potentialstock = potentialstock - 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString10,
                        [baseid],
                        (err11, res11, fields11) => {
                          if (err11) {
                            console.log(err11);
                            return;
                          }
                        }
                      );
                    }
                  }
                }
              );
              break;
          }
        }
      }
    });
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    await page.setCacheEnabled(false);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
    );

    await page.goto("https://www.poxnora.com/security/login.do", {
      waitUntil: "networkidle2",
    });
    await page.type("#username", poxUser, { delay: 0 });
    await page.type("#password", poxPw, { delay: 0 });
    await page.click('button[type="submit"]');
    await page.goto("https://www.poxnora.com/runes/load-forge.do?m=checklist");
    const jsonString = await page.evaluate(() => document.body.innerHTML);
    const allData = JSON.parse(jsonString);
    console.log(allData);
    let champs = allData.champions;
    let spells = allData.spells;
    let relics = allData.relics;
    let equipment = allData.equipment;

    let champValues = [];
    let spellValues = [];
    let equipValues = [];
    let relicValues = [];

    for (c of champs) {
      champValues.push([c.count, c.count, c.count, c.baseId]);
    }
    for (s of spells) {
      spellValues.push([s.count, s.count, s.count, s.baseId]);
    }

    for (e of equipment) {
      equipValues.push([e.count, e.count, e.count, e.baseId]);
    }

    for (r of relics) {
      relicValues.push([r.count, r.count, r.count, r.baseId]);
    }

    let queries = "";

    champValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE champs SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP WHERE basechampid = ? AND rarity != 'LIMITED'; ",
        r
      );
    });

    spellValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE spells SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP WHERE basespellid = ? AND rarity != 'LIMITED'; ",
        r
      );
    });

    equipValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE equips SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP  WHERE baseequipid = ? AND rarity != 'LIMITED'; ",
        r
      );
    });

    relicValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE relics SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP  WHERE baserelicid = ? AND rarity != 'LIMITED'; ",
        r
      );
    });

    //console.log(queries);
    connection.query(queries, [], (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        res.end();
        return;
      } else {
        res.end();
      }
    });
  }
});

app.post("/update_stock_lim", async (req, res) => {
  const pw = req.body.pw;
  if (pw == quickPw) {
    const queryString2 = "SELECT * FROM Poxpoints.carts;";
    connection.query(queryString2, [], (err4, res4, fields4) => {
      if (err4) {
        console.log(err4);
        return;
      } else {
        for (let i = 0; i < res4.length; i++) {
          let type = res4[i].type;
          let cartsid = res4[i].idcarts;
          let baseid = res4[i].baseid;
          let inorout;
          if (res4[i].changetobalance > 0) {
            inorout = 1;
          } else {
            inorout = -1;
          }
          console.log(type, cartsid, baseid, inorout);
          let idText = "";
          let typeText = "";
          let tableText = "";

          switch (parseInt(type)) {
            case 1:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
              break;
            case 3:
              idText = " baseequipid ";
              typeText = "3";
              tableText = "equips";
              break;
            case 4:
              idText = " baserelicid ";
              typeText = "4";
              tableText = "relics";
              break;
            case 2:
              idText = " basespellid ";
              typeText = "2";
              tableText = "spells";
              break;
            default:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
          }

          let columnToUpdate = "";
          switch (parseInt(inorout)) {
            case -1:
              const queryString3 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString3,
                [cartsid],
                (err4, res4, fields4) => {
                  if (err4) {
                    console.log(err4);
                    return;
                  } else {
                    let rows = res4.affectedRows;
                    if (rows > 0) {
                      const queryString5 =
                        "UPDATE " +
                        tableText +
                        " SET availablestock = availablestock + 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString5,
                        [baseid],
                        (err6, res6, fields6) => {
                          if (err6) {
                            console.log(err6);
                            return;
                          }
                        }
                      );
                    }
                  }
                }
              );

              break;
            case 1:
              const queryString8 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString8,
                [cartsid],
                (err9, res9, fields9) => {
                  if (err9) {
                    console.log(err9);
                    return;
                  } else {
                    let rows = res9.affectedRows;
                    if (rows > 0) {
                      const queryString10 =
                        "UPDATE " +
                        tableText +
                        " SET potentialstock = potentialstock - 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString10,
                        [baseid],
                        (err11, res11, fields11) => {
                          if (err11) {
                            console.log(err11);
                            return;
                          }
                        }
                      );
                    }
                  }
                }
              );
              break;
          }
        }
      }
    });
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    await page.setCacheEnabled(false);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
    );

    await page.goto("https://www.poxnora.com/security/login.do", {
      waitUntil: "networkidle2",
    });
    await page.type("#username", poxUser, { delay: 0 });
    await page.type("#password", poxPw, { delay: 0 });
    await page.click('button[type="submit"]');
    await page.goto("https://www.poxnora.com/runes/load-forge.do?m=checklist");
    const jsonString = await page.evaluate(() => document.body.innerHTML);
    const allData = JSON.parse(jsonString);
    let champs = allData.champions;
    let spells = allData.spells;
    let relics = allData.relics;
    let equipment = allData.equipment;

    let champValues = [];
    let spellValues = [];
    let equipValues = [];
    let relicValues = [];

    for (c of champs) {
      champValues.push([c.count, c.count, c.count, c.baseId]);
    }
    for (s of spells) {
      spellValues.push([s.count, s.count, s.count, s.baseId]);
    }

    for (e of equipment) {
      equipValues.push([e.count, e.count, e.count, e.baseId]);
    }

    for (r of relics) {
      relicValues.push([r.count, r.count, r.count, r.baseId]);
    }

    let queries = "";

    champValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE champs SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP WHERE basechampid = ?; ",
        r
      );
    });

    spellValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE spells SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP WHERE basespellid = ?; ",
        r
      );
    });

    equipValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE equips SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP  WHERE baseequipid = ?; ",
        r
      );
    });

    relicValues.forEach(function (r) {
      queries += mysql.format(
        "UPDATE relics SET stock = ?, availablestock = ?, potentialstock = ?, lastin = CURRENT_TIMESTAMP  WHERE baserelicid = ?; ",
        r
      );
    });

    //console.log(queries);
    connection.query(queries, [], (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        res.end();
        return;
      } else {
        res.end();
      }
    });
  }
});

app.post("/get_runes", (req, res) => {
  //1 champs, 2 spells, 3 equips, 4 relics
  let type = req.body.type;
  //1 c, 2 uc, 3 r, 4 exo, 5 leg, 6 le
  let rarity = req.body.rarity;
  //1 fw, 2 ud, 3 sl, 4 sp, 5 fs, 6 is, 7 kf, 8 st
  let faction = req.body.faction;

  let idText = "";
  let typeText = "";
  let rarityText = "";
  let factionText = "";
  let tableText = "";

  switch (parseInt(type)) {
    case 1:
      idText = " basechampid ";
      typeText = "1";
      tableText = "champs";
      break;
    case 3:
      idText = " baseequipid ";
      typeText = "3";
      tableText = "equips";
      break;
    case 4:
      idText = " baserelicid ";
      typeText = "4";
      tableText = "relics";
      break;
    case 2:
      idText = " basespellid ";
      typeText = "2";
      tableText = "spells";
      break;
    default:
      idText = " basechampid ";
      typeText = "1";
      tableText = "champs";
  }

  switch (parseInt(rarity)) {
    case 1:
      rarityText = "COMMON";
      break;
    case 2:
      rarityText = "UNCOMMON";
      break;
    case 3:
      rarityText = "RARE";
      break;
    case 4:
      rarityText = "EXOTIC";
      break;
    case 5:
      rarityText = "LEGENDARY";
      break;
    case 6:
      rarityText = "LIMITED";
      break;
    default:
      rarityText = "";
      break;
  }
  let rarityTextFull = "";
  if (rarityText != "") {
    rarityTextFull = "AND rarity ='" + rarityText + "' ";
  }
  let factionTextTwo = "";
  if (faction != "") {
    factionText = "AND rf2.idfaction = '" + faction + "'";
    factionTextTwo =
      "LEFT JOIN rune_factions AS rf2 ON(rf2.idrune = " +
      idText +
      " AND rf2.type = " +
      typeText +
      " AND rf2.idfaction = " +
      faction.toString() +
      ")";
  }
  const queryString1 =
    "SELECT " +
    idText +
    ", price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM " +
    tableText +
    "  LEFT JOIN rune_factions AS rf ON  (rf.idrune = " +
    idText +
    " AND rf.type = " +
    typeText +
    ")" +
    factionTextTwo +
    " WHERE tradeable = 1 " +
    rarityTextFull +
    " " +
    factionText +
    " GROUP by " +
    idText +
    "  order by inprice DESC, price DESC, name ASC;";
  connection.query(queryString1, [], (err2, res2, fields2) => {
    if (err2) {
      console.log(err2);
      res.end();
      return;
    } else {
      res.json(res2);
    }
  });
});

app.post("/get_runeinfo", (req, res) => {
  //1 champs, 2 equips, 3 relics, 4 spells
  let type = req.body.type;
  let baseid = req.body.baseid;

  let idText = "";
  let typeText = "";
  let tableText = "";

  switch (parseInt(type)) {
    case 1:
      idText = " basechampid ";
      typeText = "1";
      tableText = "champs";
      break;
    case 3:
      idText = " baseequipid ";
      typeText = "3";
      tableText = "equips";
      break;
    case 4:
      idText = " baserelicid ";
      typeText = "4";
      tableText = "relics";
      break;
    case 2:
      idText = " basespellid ";
      typeText = "2";
      tableText = "spells";
      break;
    default:
      idText = " basechampid ";
      typeText = "1";
      tableText = "champs";
  }

  const queryString1 =
    "SELECT " +
    idText +
    ", price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM " +
    tableText +
    "  LEFT JOIN rune_factions AS rf ON  (rf.idrune = " +
    idText +
    " AND rf.type = " +
    typeText +
    ") WHERE " +
    idText +
    "= ? AND tradeable = 1 GROUP by " +
    idText +
    "  order by inprice DESC, price DESC, name ASC;";
  connection.query(queryString1, [baseid], (err2, res2, fields2) => {
    if (err2) {
      console.log(err2);
      res.end();
      return;
    } else {
      res.json(res2);
    }
  });
});

app.post("/update_db", (req, res) => {
  const pw = req.body.pw;
  if (pw == "justalittlequickprotectionforupdating") {
    request.post(
      { url: "https://www.poxnora.com/api/feed.do?t=json" },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          //INSERT ON DUPLICATE KEY UPDATE
          const allData = JSON.parse(body);
          const champs = allData.champs;
          const spells = allData.spells;
          const equips = allData.equips;
          const relics = allData.relics;

          let factionValues = [];
          let champValues = [];
          let spellValues = [];
          let equipValues = [];
          let relicValues = [];

          for (c of champs) {
            champValues.push([
              c.id,
              c.name,
              c.rarity,
              c.hash,
              c.tradeable,
              c.runeSet,
            ]);
            for (f of c.factions) {
              console.log(c.id);
              console.log(factionId(f));
              factionValues.push([c.id, factionId(f), 1]);
            }
          }

          for (s of spells) {
            spellValues.push([
              s.id,
              s.name,
              s.rarity,
              s.hash,
              s.tradeable,
              s.runeSet,
            ]);
            for (f of s.factions) {
              factionValues.push([s.id, factionId(f), 2]);
            }
          }

          for (e of equips) {
            equipValues.push([
              e.id,
              e.name,
              e.rarity,
              e.hash,
              e.tradeable,
              e.runeSet,
            ]);
            for (f of e.factions) {
              factionValues.push([e.id, factionId(f), 3]);
            }
          }

          for (r of relics) {
            relicValues.push([
              r.id,
              r.name,
              r.rarity,
              r.hash,
              r.tradeable,
              r.runeSet,
            ]);
            for (f of r.factions) {
              factionValues.push([r.id, factionId(f), 4]);
            }
          }

          const queryString1 =
            "INSERT IGNORE INTO champs (basechampid, name, rarity, hash, tradeable, expansion) VALUES ?";
          connection.query(
            queryString1,
            [champValues],
            (err2, res2, fields2) => {
              if (err2) {
                console.log(err2);
                res.end();
                return;
              } else {
                res.end();
              }
            }
          );

          const queryString2 =
            "INSERT IGNORE INTO spells (basespellid, name, rarity, hash, tradeable, expansion) VALUES ?";
          connection.query(
            queryString2,
            [spellValues],
            (err2, res2, fields2) => {
              if (err2) {
                console.log(err2);
                res.end();
                return;
              } else {
                res.end();
              }
            }
          );

          const queryString3 =
            "INSERT IGNORE INTO equips (baseequipid, name, rarity, hash, tradeable, expansion) VALUES ?";
          connection.query(
            queryString3,
            [equipValues],
            (err2, res2, fields2) => {
              if (err2) {
                console.log(err2);
                res.end();
                return;
              } else {
                res.end();
              }
            }
          );

          const queryString4 =
            "INSERT IGNORE INTO relics (baserelicid, name, rarity, hash, tradeable, expansion) VALUES ?";
          connection.query(
            queryString4,
            [relicValues],
            (err2, res2, fields2) => {
              if (err2) {
                console.log(err2);
                res.end();
                return;
              } else {
                res.end();
              }
            }
          );

          console.log(factionValues);
          const queryString5 =
            "INSERT IGNORE INTO rune_factions (idrune, idfaction, type) VALUES ?";
          connection.query(
            queryString5,
            [factionValues],
            (err2, res2, fields2) => {
              if (err2) {
                console.log(err2);
                res.end();
                return;
              } else {
                res.end();
              }
            }
          );
        }
      }
    );
  }
});

async function addToTrade(page, id) {
  /* await page.waitForSelector('#runesList');
    await page.waitFor(2000); */
  await page.select("#runesList", id.toString());
  await page.waitForSelector(".btn");
  await page.$eval(".btn", (elem) => elem.click());
  let div_selector_to_remove = ".btn";
  await page.evaluate((sel) => {
    var elements = document.querySelectorAll(sel);
    for (var i = 0; i < elements.length; i++) {
      elements[i].parentNode.removeChild(elements[i]);
    }
  }, div_selector_to_remove);
}

async function massAddToCart(c, s, r, e, iduser) {
  //GET HASH FROM DB FOR EACH + COUNT (E.G. 2 OF SAME RUNE)
  //CHECK IF EACH HASH IS FOUND THE AMOUNT OF COUNT IN TRADE
  let regRune = new RegExp(/\/images\/runes\/sm\/\w*\.png/g);
  let regRarity = new RegExp(/rarity[0-9]">\w*\s*<\/span>/g);

  let replaceRegex = new RegExp(/rarity[0-9]">/g);

  let fullQuery = "";

  for (ch of c) {
    let hash;
    let rarity;
    hash = ch.match(regRune);
    rarity = ch.match(regRarity);
    hash = hash[0].replace("/images/runes/sm/", "");
    hash = hash.replace(".png", "");
    rarity = rarity[0].replace(replaceRegex, "");
    rarity = rarity.replace("</span>", "");
    rarity = rarity.trim();
    rarity = rarity.toUpperCase();
    console.log(hash, rarity);

    const queryString2 =
      "SELECT basechampid, price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM champs  LEFT JOIN rune_factions AS rf ON  (rf.idrune = basechampid AND rf.type = 1) WHERE hash = '" +
      hash +
      "' AND rarity = '" +
      rarity +
      "' AND tradeable = 1 GROUP by basechampid  order by inprice DESC, price DESC, name ASC;";
    connection.query(queryString2, [], async (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        return;
      } else {
        let inprice = res2[0].inprice;
        let baseid = res2[0].basechampid;
        let type = 1;
        let name = res2[0].name;
        if (name == "Pox Harbinger" || name == "Pox Renovator") {
          console.log(
            "In the weird case someone mass trades these, do not allow it (adding faction logic just for these is too much work, in normal cart it is done)!"
          );
        } else {
          const queryString4 =
            "UPDATE champs SET potentialstock = potentialstock + 1 WHERE  basechampid= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
          connection.query(
            queryString4,
            [baseid, baseid, type, iduser, inprice],
            (err5, res5, fields4) => {
              if (err5) {
                console.log(err5);
                return;
              }
            }
          );
        }
      }
    });
  }
  for (eq of e) {
    let hash;
    let rarity;
    hash = eq.match(regRune);
    rarity = eq.match(regRarity);
    hash = hash[0].replace("/images/runes/sm/", "");
    hash = hash.replace(".png", "");
    rarity = rarity[0].replace(replaceRegex, "");
    rarity = rarity.replace("</span>", "");
    rarity = rarity.trim();
    rarity = rarity.toUpperCase();
    console.log(hash, rarity);

    const queryString2 =
      "SELECT baseequipid, price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM equips  LEFT JOIN rune_factions AS rf ON  (rf.idrune = baseequipid AND rf.type = 2) WHERE hash = '" +
      hash +
      "' AND rarity = '" +
      rarity +
      "' AND tradeable = 1 GROUP by baseequipid  order by inprice DESC, price DESC, name ASC;";
    connection.query(queryString2, [], async (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        return;
      } else {
        let inprice = res2[0].inprice;
        let baseid = res2[0].baseequipid;
        let type = 3;

        const queryString4 =
          "UPDATE equips SET potentialstock = potentialstock + 1 WHERE  baseequipid= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
        connection.query(
          queryString4,
          [baseid, baseid, type, iduser, inprice],
          (err5, res5, fields4) => {
            if (err5) {
              console.log(err5);
              return;
            }
          }
        );
      }
    });
  }

  for (re of r) {
    let hash;
    let rarity;
    hash = re.match(regRune);
    rarity = re.match(regRarity);
    hash = hash[0].replace("/images/runes/sm/", "");
    hash = hash.replace(".png", "");
    rarity = rarity[0].replace(replaceRegex, "");
    rarity = rarity.replace("</span>", "");
    rarity = rarity.trim();
    rarity = rarity.toUpperCase();
    console.log(hash, rarity);

    const queryString2 =
      "SELECT baserelicid, price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM relics  LEFT JOIN rune_factions AS rf ON  (rf.idrune = baserelicid AND rf.type = 3) WHERE hash = '" +
      hash +
      "' AND rarity = '" +
      rarity +
      "' AND tradeable = 1 GROUP by baserelicid  order by inprice DESC, price DESC, name ASC;";
    connection.query(queryString2, [], async (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        return;
      } else {
        let inprice = res2[0].inprice;
        let baseid = res2[0].baserelicid;
        let type = 4;

        const queryString4 =
          "UPDATE relics SET potentialstock = potentialstock + 1 WHERE  baserelicid= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
        connection.query(
          queryString4,
          [baseid, baseid, type, iduser, inprice],
          (err5, res5, fields4) => {
            if (err5) {
              console.log(err5);
              return;
            }
          }
        );
      }
    });
  }

  for (sp of s) {
    let hash;
    let rarity;
    hash = sp.match(regRune);
    rarity = sp.match(regRarity);
    hash = hash[0].replace("/images/runes/sm/", "");
    hash = hash.replace(".png", "");
    rarity = rarity[0].replace(replaceRegex, "");
    rarity = rarity.replace("</span>", "");
    rarity = rarity.trim();
    rarity = rarity.toUpperCase();
    console.log(hash, rarity);

    const queryString2 =
      "SELECT basespellid, price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM spells  LEFT JOIN rune_factions AS rf ON  (rf.idrune = basespellid AND rf.type = 4) WHERE hash = '" +
      hash +
      "' AND rarity = '" +
      rarity +
      "' AND tradeable = 1 GROUP by basespellid  order by inprice DESC, price DESC, name ASC;";
    connection.query(queryString2, [], async (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        return;
      } else {
        let inprice = res2[0].inprice;
        let baseid = res2[0].basespellid;
        let type = 2;

        const queryString4 =
          "UPDATE spells SET potentialstock = potentialstock + 1 WHERE  basespellid= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
        connection.query(
          queryString4,
          [baseid, baseid, type, iduser, inprice],
          (err5, res5, fields4) => {
            if (err5) {
              console.log(err5);
              return;
            }
          }
        );
      }
    });
  }
}

app.post("/mass_tradein", async (req, res) => {
  const allData = req.body;
  const token = allData.token;
  const tradeid = allData.tradeid;
  const tradeurl =
    "https://www.poxnora.com/trader/viewtrade.do?id=" + tradeid.toString();
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;

  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    const queryString1 =
      "SELECT COUNT(*) as runesout FROM carts JOIN users ON (carts.iduser = users.idusers AND email = ?) WHERE changetobalance < 0; SELECT COUNT(*) as runesin FROM carts JOIN users ON (carts.iduser = users.idusers AND email = ?) WHERE changetobalance > 0; SELECT idusers, opentrades FROM users WHERE email = ?";
    connection.query(
      queryString1,
      [email, email, email],
      async (err2, res2, fields2) => {
        if (err2) {
          console.log(err2);
          res.end();
          return;
        } else {
          let iduser = res2[2][0].idusers;
          let opentrades = res2[2][0].opentrades;
          let runesIn = res2[1][0].runesin;
          let runesOut = res2[0][0].runesout;
          console.log(runesOut, runesIn);
          if (runesIn > 0 || runesOut > 0) {
            console.log("Cart not empty");
            res.send("Please make sure your cart is empty!");
            return;
          } else {
            if (opentrades == 1) {
              console.log("Has open trades");
              res.send("You currently have an open trade!");
              return;
            } else {
              //GOOD TO GO
              let browser = await puppeteer.launch({ headless: false });
              let page = await browser.newPage();
              page.setDefaultNavigationTimeout(120000);

              await page.setCacheEnabled(false);
              await page.setExtraHTTPHeaders({
                "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
              });
              await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
              );

              await page.goto("https://www.poxnora.com/security/login.do", {
                waitUntil: "networkidle2",
              });
              const inputUser = await page.$("#username");
              await inputUser.click({ clickCount: 3 });
              await inputUser.type(poxUser);
              const inputPw = await page.$("#password");
              await inputPw.click({ clickCount: 3 });
              await inputPw.type(poxPw);

              await page.click('button[type="submit"]');
              let urlToCheck = page.url();
              if (urlToCheck == "https://www.poxnora.com/index.do") {
                await page.goto(tradeurl);

                let htmlToCheck = await page.$eval("body", (element) => {
                  return element.innerHTML;
                });

                if (
                  !htmlToCheck.includes("Trade Completed") &&
                  !htmlToCheck.includes("Trade Cancelled") &&
                  !htmlToCheck.includes("Trade Expired") &&
                  !htmlToCheck.includes("a general error")
                ) {
                  console.log("Seems like an exisiting trade");

                  await page.waitForSelector(".traderPreviews");

                  let champs = await page.evaluate(() => {
                    let data = [];
                    let elements =
                      document.getElementsByClassName("championPreview");
                    for (var element of elements) data.push(element.innerHTML);
                    return data;
                  });
                  let equips = await page.evaluate(() => {
                    let data = [];
                    let elements =
                      document.getElementsByClassName("equipmentPreview");
                    for (var element of elements) data.push(element.innerHTML);
                    return data;
                  });
                  let relics = await page.evaluate(() => {
                    let data = [];
                    let elements =
                      document.getElementsByClassName("relicPreview");
                    for (var element of elements) data.push(element.innerHTML);
                    return data;
                  });
                  let spells = await page.evaluate(() => {
                    let data = [];
                    let elements =
                      document.getElementsByClassName("spellPreview");
                    for (var element of elements) data.push(element.innerHTML);
                    return data;
                  });
                  await massAddToCart(champs, spells, relics, equips, iduser);
                  res.send(
                    "Success, the runes are added to your cart, go back to the store!"
                  );
                  browser.close();
                } else {
                  console.log("Not valid trade");
                  res.send("It looks like that is not a valid trade");
                  browser.close();
                  return;
                }
              } else {
                browser.close();
                res.end();
                return;
              }
            }
          }
        }
      }
    );
  } else {
    //TOKEN COULD NOT BE VERIFIED
    console.log("Wrong token");
    res.end();
    return;
  }
});

async function verifyTrade(htmlToCheck, c, s, r, e, tok, tick) {
  //GET HASH FROM DB FOR EACH + COUNT (E.G. 2 OF SAME RUNE)
  //CHECK IF EACH HASH IS FOUND THE AMOUNT OF COUNT IN TRADE
  //IF ALL FOUND -> RETURN TRUE
  //IF NOT ALL FOUND -> RETURN FALSE
  let tradeIsLegit = false;

  if (
    !htmlToCheck.includes("Trade Completed") &&
    !htmlToCheck.includes("Trade Canceled") &&
    !htmlToCheck.includes("Trade Expired") &&
    !htmlToCheck.includes("a general error")
  ) {
    console.log("Seems like an exisiting trade");
    let fullQuery = "";

    for (ch of c) {
      fullQuery +=
        "SELECT name, hash, rarity,  group_concat(DISTINCT rf1.faction ORDER by rf1.idfaction) as factions FROM champs LEFT JOIN rune_factions AS rf ON  (rf.idrune = basechampid AND rf.type = 1) LEFT JOIN factions as rf1 ON (rf.idfaction =  rf1.idfaction) WHERE basechampid = " +
        ch +
        ";";
    }

    for (sp of s) {
      fullQuery +=
        "SELECT name, hash, rarity,  group_concat(DISTINCT rf1.faction ORDER by rf1.idfaction) as factions FROM spells LEFT JOIN rune_factions AS rf ON  (rf.idrune = basespellid AND rf.type = 2) LEFT JOIN factions as rf1 ON (rf.idfaction =  rf1.idfaction) WHERE basespellid = " +
        sp +
        ";";
    }

    for (re of r) {
      fullQuery +=
        "SELECT name, hash, rarity,  group_concat(DISTINCT rf1.faction ORDER by rf1.idfaction) as factions FROM relics LEFT JOIN rune_factions AS rf ON  (rf.idrune = baserelicid AND rf.type = 4) LEFT JOIN factions as rf1 ON (rf.idfaction =  rf1.idfaction) WHERE baserelicid = " +
        re +
        ";";
    }

    for (eq of e) {
      fullQuery +=
        "SELECT name, hash, rarity,  group_concat(DISTINCT rf1.faction ORDER by rf1.idfaction) as factions FROM equips LEFT JOIN rune_factions AS rf ON  (rf.idrune = baseequipid AND rf.type = 3) LEFT JOIN factions as rf1 ON (rf.idfaction =  rf1.idfaction) WHERE baseequipid = " +
        eq +
        ";";
    }

    console.log(fullQuery);
    const queryString = fullQuery;

    tradeIsLegit = await new Promise((resolve, reject) => {
      connection.query(queryString, [], (err2, res2, fields2) => {
        if (err2) {
          console.log(err2);
          resolve(false);
        } else {
          let runesMatch;
          let tickToksMatch;

          let allHashesToTrade = res2;
          console.log(allHashesToTrade);

          let regRunes = new RegExp(/\/images\/runes\/sm\/\w*\.png/g);
          let regRarities = new RegExp(/rarity[0-9]">\w*\s*<\/span>/g);
          let regFactions = new RegExp(
            /(?<=rarity[0-9]">\w*\s*<\/span>\s*<span.*>)(.*)(?=<\/span>)/g
          );
          let regTickToks = new RegExp(/\/images\/runes\/t\/\w*\/trader.gif/g);

          let runeMatches = htmlToCheck.match(regRunes);
          let rarityMatches = htmlToCheck.match(regRarities);
          let factionMatches = htmlToCheck.match(regFactions);

          let tickTockMatches = htmlToCheck.match(regTickToks);
          if (runeMatches == null) {
            runeMatches = [];
          }
          if (tickTockMatches == null) {
            tickTockMatches = [];
          }

          if (allHashesToTrade.length > 1) {
            for (let j = 0; j < allHashesToTrade.length; j++) {
              //MATCH AGAINST ALLHASHESTOTRADE
              let hash = allHashesToTrade[j][0].hash;
              let rarity = allHashesToTrade[j][0].rarity;
              let factions = allHashesToTrade[j][0].factions
                .split("\\")
                .join("");
              let name = allHashesToTrade[j][0].name;
              //LOOP OVER RUNE MATCHES AND COMPARE
              console.log("Looking for hash: " + hash);
              let foundHash = false;
              let foundRarity = false;
              let foundFaction = false;

              for (let i = 0; i < runeMatches.length; i++) {
                if (runeMatches[i].includes(hash)) {
                  console.log("Found hash");
                  runeMatches.splice(i, 1);
                  foundHash = true;
                  break;
                }
              }

              for (let i = 0; i < rarityMatches.length; i++) {
                if (
                  rarityMatches[i].toLowerCase().includes(rarity.toLowerCase())
                ) {
                  console.log("Found rarity");
                  rarityMatches.splice(i, 1);
                  foundRarity = true;
                  break;
                }
              }
              if (name == "Pox Harbinger" || name == "Pox Renovator") {
                console.log("Shiny runes");
                for (let i = 0; i < factionMatches.length; i++) {
                  if (
                    factionMatches[i].trim().toLowerCase() ==
                    factions.trim().toLowerCase()
                  ) {
                    console.log("Found faction");
                    foundFaction = true;
                    break;
                  }
                }
              } else {
                foundFaction = true;
              }

              if (
                foundHash == true &&
                foundRarity == true &&
                foundFaction == true
              ) {
                allHashesToTrade.splice(j, 1);
                j--;
              }
            }
          } else {
            for (let j = 0; j < allHashesToTrade.length; j++) {
              //MATCH AGAINST ALLHASHESTOTRADE
              let hash = allHashesToTrade[j].hash;
              let rarity = allHashesToTrade[j].rarity;
              let factions = allHashesToTrade[j].factions.split("\\").join("");
              let name = allHashesToTrade[j].name;
              //LOOP OVER RUNE MATCHES AND COMPARE
              console.log("Looking for hash: " + hash);
              let foundHash = false;
              let foundRarity = false;
              let foundFaction = false;

              for (let i = 0; i < runeMatches.length; i++) {
                if (runeMatches[i].includes(hash)) {
                  console.log("Found hash");
                  runeMatches.splice(i, 1);
                  foundHash = true;
                  break;
                }
              }

              for (let i = 0; i < rarityMatches.length; i++) {
                if (
                  rarityMatches[i].toLowerCase().includes(rarity.toLowerCase())
                ) {
                  console.log("Found rarity");
                  rarityMatches.splice(i, 1);
                  foundRarity = true;
                  break;
                }
              }

              if (name == "Pox Harbinger" || name == "Pox Renovator") {
                console.log("Shiny runes");
                for (let i = 0; i < factionMatches.length; i++) {
                  if (
                    factionMatches[i].trim().toLowerCase() ==
                    factions.trim().toLowerCase()
                  ) {
                    console.log("Found faction");
                    foundFaction = true;
                    break;
                  }
                }
              } else {
                foundFaction = true;
              }

              if (
                foundHash == true &&
                foundRarity == true &&
                foundFaction == true
              ) {
                allHashesToTrade.splice(j, 1);
                j--;
              }
            }
          }

          if (
            allHashesToTrade.length == 0 &&
            runeMatches.length == 0 &&
            rarityMatches.length == 0
          ) {
            runesMatch = true;
          } else {
            runesMatch = false;
          }

          let tokIn = tok;
          let tickIn = tick;

          for (let i = 0; i < tokIn.length; i++) {
            let idTok = tokIn[i];
            for (let j = 0; j < tickTockMatches.length; j++) {
              if (
                tickTockMatches[j] ==
                "/images/runes/t/" + idTok + "/trader.gif"
              ) {
                console.log("Found: " + tickTockMatches[i]);
                tokIn.splice(i, 1);
                tickTockMatches.splice(j, 1);
                i--;
                break;
              }
            }
          }

          for (let i = 0; i < tickIn.length; i++) {
            let idTick = tickIn[i];
            for (let j = 0; j < tickTockMatches.length; j++) {
              if (
                tickTockMatches[j] ==
                "/images/runes/t/" + idTick + "/trader.gif"
              ) {
                console.log("Found: " + tickTockMatches[j]);
                tickIn.splice(i, 1);
                tickTockMatches.splice(j, 1);
                i--;
                break;
              }
            }
          }

          if (
            tickIn.length == 0 &&
            tokIn.length == 0 &&
            tickTockMatches.length == 0
          ) {
            tickToksMatch = true;
          } else {
            tickToksMatch = false;
          }

          console.log("Runes match: " + runesMatch);
          console.log("Tickets and tokens match: " + tickToksMatch);

          if (runesMatch && tickToksMatch) {
            //return true;
            console.log("All runes, tickets and tokens match!");
            resolve(true);
          } else {
            //return false;
            console.log("Trade doesn't match cart!");
            resolve(false);
          }
        }
      });
    });
    console.log(tradeIsLegit);
    return tradeIsLegit;
  } else {
    console.log("This trade url is not working");
    tradeIsLegit = false;
    console.log(tradeIsLegit);
    return tradeIsLegit;
  }
}

async function bidOnTrade(
  browser,
  url,
  c,
  s,
  r,
  e,
  tok,
  tick,
  cIn,
  sIn,
  rIn,
  eIn,
  tokIn,
  tickIn,
  newbalance,
  iduser
) {
  let page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);

  await page.setCacheEnabled(false);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
  );

  await page.goto("https://www.poxnora.com/security/login.do", {
    waitUntil: "networkidle2",
  });
  const inputUser = await page.$("#username");
  await inputUser.click({ clickCount: 3 });
  await inputUser.type(poxUser);
  const inputPw = await page.$("#password");
  await inputPw.click({ clickCount: 3 });
  await inputPw.type(poxPw);

  await page.click('button[type="submit"]');
  let urlToCheck = page.url();
  if (urlToCheck == "https://www.poxnora.com/index.do") {
    await page.goto(url);

    let htmlToCheck = await page.$eval("body", (element) => {
      return element.innerHTML;
    });

    let tradeIsLegit = await verifyTrade(
      htmlToCheck,
      cIn,
      sIn,
      rIn,
      eIn,
      tokIn,
      tickIn
    );

    console.log(tradeIsLegit);

    if (tradeIsLegit == true) {
      await page.click(".btn");
      await page.waitForSelector("#description");
      await page.type(
        "#description",
        "Thanks for using Poxpoints! Enjoy your new runes!",
        { delay: 0 }
      );
      await page.waitForSelector("#typesList");

      await page.select("#typesList", "0");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (champId of c) {
        await addToTrade(page, champId);
      }

      await page.select("#typesList", "1");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (spellId of s) {
        await addToTrade(page, spellId);
      }

      await page.select("#typesList", "2");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (relicId of r) {
        await addToTrade(page, relicId);
      }

      await page.select("#typesList", "3");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (equipId of e) {
        await addToTrade(page, equipId);
      }

      await page.select("#typesList", "4");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (tokenId of tok) {
        await addToTrade(page, tokenId);
      }

      await page.select("#typesList", "5");
      await page.waitForSelector("#runesList");
      await page.waitFor(2000);
      for await (ticketId of tick) {
        await addToTrade(page, ticketId);
      }

      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.evaluate(() => {
        let allBtns = document.getElementsByClassName("btn");
        let btnToClick = allBtns[allBtns.length - 1];
        console.log("test");
        console.log(allBtns);
        console.log(btnToClick);
        btnToClick.click();
      });

      //CHECK IF BID IS ACCEPTED EVERY 20SEC
      let checkPage = setInterval(async () => {
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        let htmlToCheckTwo = await page.$eval(".traderPreviews", (element) => {
          return element.innerHTML;
        });
        if (htmlToCheckTwo.includes("Bid Accepted")) {
          clearInterval(checkPage);
          console.log("Bid accepted");
          const queryString2 =
            "UPDATE users SET opentrades = 0, points = ? WHERE idusers = ?";
          connection.query(
            queryString2,
            [newbalance, iduser],
            (err3, res3, fields3) => {
              if (err3) {
                console.log(err3);
                res.end();
                return;
              } else {
              }
            }
          );
          let fullQuery = "DELETE FROM carts WHERE iduser = " + iduser + ";";

          //FOR RUNES TRADED OUT
          //READ: LAST IN ==== LAST TRADED NOW (THIS IS TO PREVENT TRADIN OUT WAIT FOR 10% PRICE RAISE 2 DAYS LATER AND TRADE IN AGAIN)!
          for (ch of c) {
            fullQuery +=
              "UPDATE champs SET stock = stock - 1, potentialstock = potentialstock - 1, lastin = CURRENT_TIMESTAMP   WHERE basechampid=" +
              ch +
              ";";
          }

          for (sp of s) {
            fullQuery +=
              "UPDATE spells SET stock = stock - 1, potentialstock = potentialstock - 1, lastin = CURRENT_TIMESTAMP  WHERE basespellid=" +
              sp +
              ";";
          }

          for (re of r) {
            fullQuery +=
              "UPDATE relics SET stock = stock - 1, potentialstock = potentialstock - 1, lastin = CURRENT_TIMESTAMP  WHERE baserelicid=" +
              re +
              ";";
          }

          for (eq of e) {
            fullQuery +=
              "UPDATE equips SET stock = stock - 1, potentialstock = potentialstock - 1, lastin = CURRENT_TIMESTAMP  WHERE baseequipid=" +
              eq +
              ";";
          }

          //FOR RUNES TRADED IN
          for (ch of cIn) {
            fullQuery +=
              "UPDATE champs SET stock = stock + 1, availablestock = availablestock + 1, lastin = CURRENT_TIMESTAMP  WHERE basechampid=" +
              ch +
              ";";
          }

          for (sp of sIn) {
            fullQuery +=
              "UPDATE spells SET stock = stock + 1, availablestock = availablestock + 1, lastin = CURRENT_TIMESTAMP WHERE basespellid=" +
              sp +
              ";";
          }

          for (re of rIn) {
            fullQuery +=
              "UPDATE relics SET stock = stock + 1, availablestock = availablestock + 1, lastin = CURRENT_TIMESTAMP WHERE baserelicid=" +
              re +
              ";";
          }

          for (eq of eIn) {
            fullQuery +=
              "UPDATE equips SET stock = stock + 1, availablestock = availablestock + 1, lastin = CURRENT_TIMESTAMP WHERE baseequipid=" +
              eq +
              ";";
          }
          //TODO ADD QUERIES FOR TOKENS AND TICKETS

          connection.query(fullQuery, [], (err4, res4, fields4) => {
            if (err4) {
              console.log(err4);
              browser.close();
              setOpenTradeToNull(iduser);
              res.end();
              return;
            } else {
              browser.close();
            }
          });
        } else {
          if (htmlToCheckTwo.includes("Bid Rejected")) {
            clearInterval(checkPage);
            console.log("Bid rejected");
            setOpenTradeToNull(iduser);
            browser.close();
          } else {
            if (htmlToCheckTwo.includes("Bid Cancelled")) {
              clearInterval(checkPage);
              console.log("Bid cancelled");
              setOpenTradeToNull(iduser);
              browser.close();
            } else {
              console.log("Bid not yet accepted!");
            }
          }
        }
      }, 1000 * 20);
      return true;
    } else {
      //TRADE DOESN'T MATCH SELECTED IN STORE OR URL IS FUCKED
      console.log("The trade url is wrong, or the runes did not match!");
      setOpenTradeToNull(iduser);
      browser.close();
      return false;
    }
  } else {
    //SOMETHING WENT WRONG
    console.log("It broke");
    setOpenTradeToNull(iduser);
    browser.close();
    return false;
  }
}

app.post("/get_cart", async (req, res) => {
  const allData = req.body;
  const token = allData.token;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;

  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    const queryString1 = "SELECT idusers FROM users WHERE email = ?";
    connection.query(queryString1, [email], (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        res.end();
        return;
      } else {
        let iduser = res2[0].idusers;
        console.log(iduser);
        const queryString2 =
          "(SELECT idcarts, baseid, type, iduser, changetobalance, addedon, CASE WHEN type = 1 THEN champs.name WHEN type = 2 THEN spells.name WHEN type = 3 THEN equips.name WHEN type = 4 THEN relics.name END as name, CASE WHEN type = 1 THEN champs.hash WHEN type = 2 THEN spells.hash WHEN type = 3 THEN equips.hash WHEN type = 4 THEN relics.hash END AS hash FROM carts  LEFT JOIN champs ON baseid = basechampid AND type = 1 LEFT JOIN spells ON baseid = basespellid AND type = 2 LEFT JOIN equips ON baseid = baseequipid AND type = 3 LEFT JOIN relics ON baseid = baserelicid AND type = 4 WHERE iduser = ? AND changetobalance >= 0 ORDER BY changetobalance DESC) UNION (SELECT idcarts, baseid, type, iduser, changetobalance, addedon, CASE WHEN type = 1 THEN champs.name WHEN type = 2 THEN spells.name WHEN type = 3 THEN equips.name WHEN type = 4 THEN relics.name END as name, CASE WHEN type = 1 THEN champs.hash WHEN type = 2 THEN spells.hash WHEN type = 3 THEN equips.hash WHEN type = 4 THEN relics.hash END AS hash FROM carts  LEFT JOIN champs ON baseid = basechampid AND type = 1 LEFT JOIN spells ON baseid = basespellid AND type = 2 LEFT JOIN equips ON baseid = baseequipid AND type = 3 LEFT JOIN relics ON baseid = baserelicid AND type = 4 WHERE iduser = ? AND changetobalance < 0 ORDER BY changetobalance ASC)";
        connection.query(
          queryString2,
          [iduser, iduser],
          (err3, res3, fields3) => {
            if (err3) {
              console.log(err3);
              res.end();
              return;
            } else {
              res.json(res3);
            }
          }
        );
      }
    });
  } else {
    //NOT LOGGED IN PROPERLY
    console.log("Not logged in");
    res.end();
  }
});

app.post("/remove_from_cart", async (req, res) => {
  const allData = req.body;
  const type = allData.type;
  const baseid = allData.baseid;
  const token = allData.token;
  const inorout = allData.inorout;
  const cartsid = allData.cartsid;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;

  //CHECK IF USER IS LOGGED IN PROPERLY
  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    const queryString2 = "SELECT opentrades FROM users WHERE email = ?";
    connection.query(queryString2, [email], (err3, res3, fields3) => {
      if (err3) {
        console.log(err3);
        res.end();
      } else {
        console.log(res3[0].opentrades);
        if (res3[0].opentrades == 0) {
          let idText = "";
          let typeText = "";
          let tableText = "";

          switch (parseInt(type)) {
            case 1:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
              break;
            case 3:
              idText = " baseequipid ";
              typeText = "3";
              tableText = "equips";
              break;
            case 4:
              idText = " baserelicid ";
              typeText = "4";
              tableText = "relics";
              break;
            case 2:
              idText = " basespellid ";
              typeText = "2";
              tableText = "spells";
              break;
            default:
              idText = " basechampid ";
              typeText = "1";
              tableText = "champs";
          }

          let columnToUpdate = "";
          switch (parseInt(inorout)) {
            case -1:
              const queryString3 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString3,
                [cartsid],
                (err4, res4, fields4) => {
                  if (err4) {
                    console.log(err4);
                    res.status(500);
                    return;
                  } else {
                    let rows = res4.affectedRows;
                    if (rows > 0) {
                      const queryString5 =
                        "UPDATE " +
                        tableText +
                        " SET availablestock = availablestock + 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString5,
                        [baseid],
                        (err6, res6, fields6) => {
                          if (err6) {
                            console.log(err6);
                            res.status(500);
                            return;
                          } else {
                            res.json({ Ok: "Ok" });
                          }
                        }
                      );
                    } else {
                      res.status(500);
                    }
                  }
                }
              );

              break;
            case 1:
              const queryString8 = "DELETE FROM carts WHERE idcarts = ?";
              connection.query(
                queryString8,
                [cartsid],
                (err9, res9, fields9) => {
                  if (err9) {
                    console.log(err9);
                    res.status(500);
                    return;
                  } else {
                    let rows = res9.affectedRows;
                    if (rows > 0) {
                      const queryString10 =
                        "UPDATE " +
                        tableText +
                        " SET potentialstock = potentialstock - 1 WHERE " +
                        idText +
                        "= ?;";
                      connection.query(
                        queryString10,
                        [baseid],
                        (err11, res11, fields11) => {
                          if (err11) {
                            console.log(err11);
                            res.status(500);
                            return;
                          } else {
                            res.json({ Ok: "Ok" });
                          }
                        }
                      );
                    } else {
                      res.status(500);
                    }
                  }
                }
              );
              break;
            default:
              res.status(500);
              break;
          }
        } else {
          res.status(500);
        }
      }
    });
  } else {
    //FALSE LOGIN
    console.log("Wrong log in");
    res.end();
  }
});

app.post("/add_to_cart", async (req, res) => {
  const allData = req.body;
  const type = allData.type;
  const baseid = allData.baseid;
  const token = allData.token;
  const inorout = allData.inorout;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;

  //CHECK IF USER IS LOGGED IN PROPERLY
  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    const queryString1 =
      "SELECT COUNT(*) as runesout FROM carts JOIN users ON (carts.iduser = users.idusers AND email = ?) WHERE changetobalance < 0; SELECT COUNT(*) as runesin FROM carts JOIN users ON (carts.iduser = users.idusers AND email = ?) WHERE changetobalance > 0; SELECT idusers, opentrades FROM users WHERE email = ?";
    connection.query(
      queryString1,
      [email, email, email],
      (err2, res2, fields2) => {
        if (err2) {
          console.log(err2);
          res.end();
          return;
        } else {
          let iduser = res2[2][0].idusers;
          let opentrades = res2[2][0].opentrades;
          let runesIn = res2[1][0].runesin;
          let runesOut = res2[0][0].runesout;
          console.log(runesIn);
          console.log(runesOut);
          console.log(iduser);
          if (runesIn < 100 && runesOut < 100) {
            if (opentrades == 0) {
              let idText = "";
              let typeText = "";
              let tableText = "";

              switch (parseInt(type)) {
                case 1:
                  idText = " basechampid ";
                  typeText = "1";
                  tableText = "champs";
                  break;
                case 3:
                  idText = " baseequipid ";
                  typeText = "3";
                  tableText = "equips";
                  break;
                case 4:
                  idText = " baserelicid ";
                  typeText = "4";
                  tableText = "relics";
                  break;
                case 2:
                  idText = " basespellid ";
                  typeText = "2";
                  tableText = "spells";
                  break;
                default:
                  idText = " basechampid ";
                  typeText = "1";
                  tableText = "champs";
              }

              const queryString2 =
                "SELECT " +
                idText +
                ", price, name, hash, rarity, expansion,  CASE WHEN rarity ='COMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='COMMON' AND potentialstock >= 1 AND potentialstock < 25 THEN ROUND(price * 0.9) WHEN rarity ='COMMON' AND potentialstock >= 25 AND potentialstock < 45 THEN ROUND(price * 0.8) WHEN rarity ='COMMON' AND potentialstock >= 45 AND potentialstock < 60 THEN ROUND(price * 0.7) WHEN rarity ='COMMON' AND potentialstock >= 60 AND potentialstock < 70 THEN ROUND(price * 0.6) WHEN rarity ='COMMON' AND potentialstock >= 70 THEN ROUND(price * 0.2) WHEN rarity ='UNCOMMON' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='UNCOMMON' AND potentialstock >= 1 AND potentialstock < 15 THEN ROUND(price * 0.9) WHEN rarity ='UNCOMMON' AND potentialstock >= 15 AND potentialstock < 25 THEN ROUND(price * 0.8) WHEN rarity ='UNCOMMON' AND potentialstock >= 25 AND potentialstock < 35 THEN ROUND(price * 0.6) WHEN rarity ='UNCOMMON' AND potentialstock >= 35 THEN ROUND(price * 0.2) WHEN rarity ='RARE' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='RARE' AND potentialstock >= 1 AND potentialstock < 10 THEN ROUND(price * 0.9) WHEN rarity ='RARE' AND potentialstock >= 10 AND potentialstock < 18 THEN ROUND(price * 0.8) WHEN rarity ='RARE' AND potentialstock >= 18 AND potentialstock < 25 THEN ROUND(price * 0.6) WHEN rarity ='RARE' AND potentialstock >= 25 THEN ROUND(price * 0.2) WHEN rarity ='EXOTIC' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='EXOTIC' AND potentialstock >= 1 AND potentialstock < 7 THEN ROUND(price * 0.9) WHEN rarity ='EXOTIC' AND potentialstock >= 7 AND potentialstock < 13 THEN ROUND(price * 0.8) WHEN rarity ='EXOTIC' AND potentialstock >= 13 AND potentialstock < 18 THEN ROUND(price * 0.6) WHEN rarity ='EXOTIC' AND potentialstock >= 18 THEN ROUND(price * 0.2) WHEN rarity ='LEGENDARY' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LEGENDARY' AND potentialstock >= 1 AND potentialstock < 5 THEN ROUND(price * 0.9) WHEN rarity ='LEGENDARY' AND potentialstock >= 5 AND potentialstock < 9 THEN ROUND(price * 0.8) WHEN rarity ='LEGENDARY' AND potentialstock >= 9 AND potentialstock < 12 THEN ROUND(price * 0.6) WHEN rarity ='LEGENDARY' AND potentialstock >= 12 THEN ROUND(price * 0.2) WHEN rarity ='LIMITED' AND potentialstock < 1 THEN ROUND(price * 0.95) WHEN rarity ='LIMITED' AND potentialstock >= 1 AND potentialstock < 2 THEN ROUND(price * 0.9) WHEN rarity ='LIMITED' AND potentialstock >= 2 AND potentialstock < 3 THEN ROUND(price * 0.8) WHEN rarity ='LIMITED' AND potentialstock >= 3 AND potentialstock < 4 THEN ROUND(price * 0.6) WHEN rarity ='LIMITED' AND potentialstock >= 4 THEN ROUND(price * 0.2) ELSE price * 0.95 END AS inprice  , group_concat(DISTINCT rf.idfaction ORDER by rf.idfaction) as factions, IF(availablestock > 0, true, false) as instock FROM " +
                tableText +
                "  LEFT JOIN rune_factions AS rf ON  (rf.idrune = " +
                idText +
                " AND rf.type = " +
                typeText +
                ") WHERE " +
                idText +
                "= ? AND tradeable = 1 GROUP by " +
                idText +
                "  order by inprice DESC, price DESC, name ASC;";
              connection.query(
                queryString2,
                [baseid],
                (err3, res3, fields3) => {
                  if (err3) {
                    console.log(err3);
                    res.end();
                    return;
                  } else {
                    console.log(res3);
                    let inprice = res3[0].inprice;
                    let outprice = res3[0].price * -1;
                    let basedidtoinsert = baseid;
                    console.log(basedidtoinsert);

                    let columnToUpdate = "";
                    switch (parseInt(inorout)) {
                      case -1:
                        const queryString3 =
                          "UPDATE " +
                          tableText +
                          " SET availablestock = availablestock - 1 WHERE " +
                          idText +
                          "= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
                        connection.query(
                          queryString3,
                          [baseid, baseid, type, iduser, outprice],
                          (err4, res4, fields4) => {
                            if (err4) {
                              console.log(err4);
                              res.end();
                              return;
                            } else {
                              res.json(res4);
                            }
                          }
                        );
                        break;
                      case 1:
                        const queryString4 =
                          "UPDATE " +
                          tableText +
                          " SET potentialstock = potentialstock + 1 WHERE " +
                          idText +
                          "= ?; INSERT INTO carts (baseid, type, iduser, changetobalance) VALUES (?, ?, ?, ?)";
                        connection.query(
                          queryString4,
                          [baseid, baseid, type, iduser, inprice],
                          (err5, res5, fields4) => {
                            if (err5) {
                              console.log(err5);
                              res.end();
                              return;
                            } else {
                              res.json(res5);
                            }
                          }
                        );
                        break;
                      default:
                        res.end();
                        break;
                    }
                  }
                }
              );
            } else {
              console.log("User has open trade");
              res.send("Accept your open trade (can take 1min to update)!");
              return;
            }
          } else {
            //LET USER KNOW HE CAN MAX HAVE 100 RUNES OR HE HAS AN OPEN TRADE
            console.log("Too many runes traded IN or OUT");
            res.send("You can trade max 100 runes in and out at once");
            return;
          }
        }
      }
    );
  } else {
    //FALSE LOGIN
    console.log("Wrong login");
    res.end();
  }
});

function setOpenTradeToNull(iduser) {
  const ot1 = "UPDATE users SET opentrades = 0 WHERE idusers = ?";
  connection.query(ot1, [iduser], (err20, res20, fields20) => {
    if (err20) {
      console.log(err20);
      res.end();
      return;
    } else {
    }
  });
}

app.post("/maketrade", async (req, res) => {
  const allData = req.body;
  const token = allData.token;
  const username = allData.login[0].username;
  const password = allData.login[0].password;
  let tradeUrl = allData.tradeUrl;

  let champsToTradeIn = [];
  let spellsToTradeIn = [];
  let relicsToTradeIn = [];
  let equipsToTradeIn = [];
  let tokensToTradeIn = [];
  let ticketsToTradeIn = [];

  let champsToTradeOut = [];
  let spellsToTradeOut = [];
  let relicsToTradeOut = [];
  let equipsToTradeOut = [];
  let tokensToTradeOut = [];
  let ticketsToTradeOut = [];

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload.email;

  //CHECK IF USER IS LOGGED IN PROPERLY
  if (
    clientId == payload.aud &&
    (payload.iss == "accounts.google.com" ||
      payload.iss == "https://accounts.google.com") &&
    Date.now() < payload.exp * 1000
  ) {
    //GET TOTAL IN AND TOTAL OUT + CREATE JSON FOR IN AND OUT FROM QUERY
    let balance;
    let iduser;
    let openTrades;
    const queryString1 =
      "SELECT idusers, points, opentrades FROM users WHERE email = ?";
    connection.query(queryString1, [email], async (err2, res2, fields2) => {
      if (err2) {
        console.log(err2);
        res.send("Something went wrong");
        return;
      } else {
        balance = res2[0].points;
        iduser = res2[0].idusers;
        openTrades = res2[0].opentrades;
        console.log(openTrades, iduser, balance);

        if (openTrades == 0) {
          const ot1 = "UPDATE users SET opentrades = 1 WHERE idusers = ?";
          connection.query(ot1, [iduser], (err20, res20, fields20) => {
            if (err20) {
              console.log(err20);
              setOpenTradeToNull(iduser);
              res.send("Something went wrong");
              return;
            } else {
            }
          });

          const queryString2 = "SELECT * FROM carts WHERE iduser = ?";
          connection.query(
            queryString2,
            [iduser],
            async (err3, res3, fields3) => {
              if (err2) {
                console.log(err2);
                setOpenTradeToNull(iduser);
                res.send("Something went wrong");
                return;
              } else {
                let cart = res3;
                let totalIn = 0;
                let totalOut = 0;
                let newBalance = 0;

                console.log(cart);

                for (i of cart) {
                  if (i.changetobalance < 0) {
                    totalOut += i.changetobalance;
                    switch (parseInt(i.type)) {
                      case 1:
                        champsToTradeOut.push(i.baseid);
                        break;
                      case 3:
                        equipsToTradeOut.push(i.baseid);
                        break;
                      case 4:
                        relicsToTradeOut.push(i.baseid);
                        break;
                      case 2:
                        spellsToTradeOut.push(i.baseid);
                        break;
                    }
                  } else {
                    totalIn += i.changetobalance;
                    switch (parseInt(i.type)) {
                      case 1:
                        champsToTradeIn.push(i.baseid);
                        break;
                      case 3:
                        equipsToTradeIn.push(i.baseid);
                        break;
                      case 4:
                        relicsToTradeIn.push(i.baseid);
                        break;
                      case 2:
                        spellsToTradeIn.push(i.baseid);
                        break;
                    }
                  }
                }
                console.log(champsToTradeIn, champsToTradeOut);
                newBalance = balance + totalIn + totalOut;
                if (
                  (champsToTradeIn.length == 0 &&
                    spellsToTradeIn.length == 0 &&
                    relicsToTradeIn.length == 0 &&
                    equipsToTradeIn.length == 0 &&
                    tokensToTradeIn.length == 0 &&
                    ticketsToTradeIn.length == 0) ||
                  (champsToTradeOut.length == 0 &&
                    spellsToTradeOut.length == 0 &&
                    relicsToTradeOut.length == 0 &&
                    equipsToTradeOut.length == 0 &&
                    tokensToTradeOut.length == 0 &&
                    ticketsToTradeOut.length == 0)
                ) {
                  //DON'T ACCEPT TRADE, NEEDS SOMETHING TRADED IN AND SOMETHING TRADED OUT
                  console.log(
                    "User did not select both something to trade IN and OUT"
                  );
                  setOpenTradeToNull(iduser);
                  res.send("Trade at least one rune in and out");
                  return;
                } else {
                  if (newBalance >= 0) {
                    //PROBABLY GOOD TO WRAP THE WHOLE THING IN A TRY CATCH FOR WHEN POXSERVERS ARE ACTING UP
                    let browser = await puppeteer.launch({ headless: false });
                    try {
                      //FULLY AUTOMATED (WE SET UP BOTH TRADES)
                      if (tradeUrl == "") {
                        let page = await browser.newPage();
                        page.setDefaultNavigationTimeout(120000);

                        await page.setCacheEnabled(false);
                        await page.setExtraHTTPHeaders({
                          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
                        });
                        await page.setUserAgent(
                          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
                        );

                        await page.goto(
                          "https://www.poxnora.com/security/login.do",
                          { waitUntil: "networkidle2" }
                        );
                        await page.type("#username", username, { delay: 0 });
                        await page.type("#password", password, { delay: 0 });
                        await page.click('button[type="submit"]');
                        let urlToCheck = page.url();
                        if (urlToCheck == "https://www.poxnora.com/index.do") {
                          await page.goto(
                            "https://www.poxnora.com/trader/addtrade.do?fb=0"
                          );
                          await page.type("#subject", "Poxpoints", {
                            delay: 0,
                          });
                          await page.type(
                            "#description",
                            "A succesfully created trade through Poxpoints!",
                            { delay: 0 }
                          );
                          await page.select("#typesList", "0");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (champId of champsToTradeIn) {
                            await addToTrade(page, champId);
                          }

                          await page.select("#typesList", "1");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (spellId of spellsToTradeIn) {
                            await addToTrade(page, spellId);
                          }

                          await page.select("#typesList", "2");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (relicId of relicsToTradeIn) {
                            await addToTrade(page, relicId);
                          }

                          await page.select("#typesList", "3");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (equipId of equipsToTradeIn) {
                            await addToTrade(page, equipId);
                          }

                          await page.select("#typesList", "4");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (tokenId of tokensToTradeIn) {
                            await addToTrade(page, tokenId);
                          }

                          await page.select("#typesList", "5");
                          await page.waitForSelector("#runesList");
                          await page.waitFor(2000);
                          for await (ticketId of ticketsToTradeIn) {
                            await addToTrade(page, ticketId);
                          }
                          await page.click('button[type="submit"]');
                          await page.waitForNavigation();

                          tradeUrl = page.url();
                          let bidded = await bidOnTrade(
                            browser,
                            tradeUrl,
                            champsToTradeOut,
                            spellsToTradeOut,
                            relicsToTradeOut,
                            equipsToTradeOut,
                            tokensToTradeOut,
                            ticketsToTradeOut,
                            champsToTradeIn,
                            spellsToTradeIn,
                            relicsToTradeIn,
                            equipsToTradeIn,
                            tokensToTradeIn,
                            ticketsToTradeIn,
                            newBalance,
                            iduser
                          );
                          console.log(bidded);
                          if (bidded == true) {
                            res.send("Success, accept the bid and wait a bit!");
                            return;
                          } else {
                            setOpenTradeToNull(iduser);
                            res.send("Looks like something went wrong!");
                            return;
                          }
                        } else {
                          //WRONG USERNAME OR PW
                          console.log("Wrong username or pw");
                          browser.close();
                          setOpenTradeToNull(iduser);
                          res.send("Pox username or password is wrong");
                          return;
                        }
                      } else {
                        tradeUrl =
                          "https://www.poxnora.com/trader/viewtrade.do?id=" +
                          tradeUrl.toString();
                        let bidded = await bidOnTrade(
                          browser,
                          tradeUrl,
                          champsToTradeOut,
                          spellsToTradeOut,
                          relicsToTradeOut,
                          equipsToTradeOut,
                          tokensToTradeOut,
                          ticketsToTradeOut,
                          champsToTradeIn,
                          spellsToTradeIn,
                          relicsToTradeIn,
                          equipsToTradeIn,
                          tokensToTradeIn,
                          ticketsToTradeIn,
                          newBalance,
                          iduser
                        );
                        console.log(bidded);
                        if (bidded == true) {
                          res.send("Success, accept the bid on your trade");
                          return;
                        } else {
                          setOpenTradeToNull(iduser);
                          res.send("Please check the runes in your trade");
                          return;
                        }
                      }
                    } catch (err) {
                      console.log(err);
                      browser.close();
                      setOpenTradeToNull(iduser);
                      res.send(
                        "Woops, something went wrong! Are you sure you have the runes?"
                      );
                      return;
                    }
                  } else {
                    //LET USER KNOW HIS BALANCE IS INSUFFICIENT
                    setOpenTradeToNull(iduser);
                    console.log("User does not have enough points");
                    res.send("Your balance is insufficient");
                    return;
                  }
                }
              }
            }
          );
        } else {
          //LET USER KNOW HE NEEDS TO ACCEPT LAST TRADE
          console.log("User has open trade");
          res.send("Accept the last trade first");
          return;
        }
      }
    });
  } else {
    //PROBLEM WITH TOKEN
    console.log("Problem with Google token");
    res.send("Please log in with Google");
    return;
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    req.token = bearerHeader;
    next();
  } else {
    res.status(403);
  }
}

http.listen(httpPort, () => {
  console.log("Server is running on port " + httpPort);
});
