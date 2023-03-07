let GoogleAuth;

let inValue = 0;
let outValue = 0;
let userBalance = 0;
let newBalance = 0;
let cart;

//let baseUrl = 'http://localhost:3000/';
let baseUrl = "https://api.poxpoints.com/";

let openTradesChecker;

$(document).ready(function () {
  //updateStock(quickpw);
  //updateStockLim(quickpw);

  getRunes(1, 5, "");
  setInterval(refreshPrices, 450 * 1000);

  $("#verify-mass-trade").on("click", function () {
    if (GoogleAuth != undefined) {
      if ($("#mass-trade-id").val() != "") {
        $(".mass-trade-message").text("Processing mass add to cart...");
        let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
        let tradeid = $("#mass-trade-id").val();
        $.ajax({
          url: baseUrl + "mass_tradein",
          type: "POST",
          dataType: "json",
          data: { token: token, tradeid: tradeid },
          complete: function (data) {
            $(".mass-trade-message").text(data.responseText);
          },
        });
      } else {
        $(".mass-trade-message").text(
          "Add a trade id (trade needs to be open)"
        );
      }
    } else {
      $(".abcRioButton").trigger("click");
    }
  });

  $(".check-out-button").on("click", function () {
    fullTrade();
  });

  $(".manual-button").on("click", function () {
    $(".manual-input").addClass("active");
    $(".manual-input").removeClass("inactive");

    $(".automated-input").addClass("inactive");
    $(".automated-input").removeClass("active");

    $(".manual-button").addClass("active");
    $(".manual-button").removeClass("inactive");

    $(".automated-button").addClass("inactive");
    $(".automated-button").removeClass("active");

    $("#pox-username").val("");
    $("#pox-pw").val("");
  });

  $(".automated-button").on("click", function () {
    $(".automated-input").addClass("active");
    $(".automated-input").removeClass("inactive");

    $(".manual-input").addClass("inactive");
    $(".manual-input").removeClass("active");

    $(".automated-button").addClass("active");
    $(".automated-button").removeClass("inactive");

    $(".manual-button").addClass("inactive");
    $(".manual-button").removeClass("active");

    $("#trade-id").val("");
  });

  $(".trader-select").on("change", function () {
    let type = $("#type").val();
    let faction = $("#faction").val();
    let rarity = $("#rarity").val();

    if (rarity == "-1") {
      rarity = "";
    }
    if (faction == "-1") {
      faction = "";
    }
    if (parseInt(type) <= 4) {
      $("#faction").css("opacity", 100);
      $("#rarity").css("opacity", 100);
      getRunes(type, faction, rarity);
    } else {
      $("#faction").css("opacity", 0);
      $("#rarity").css("opacity", 0);
      //TODO: getToken / getTickets
    }
  });

  $(".trader-scroll").on("click", ".item-out", async function () {
    if (GoogleAuth != undefined) {
      let el = $(this);
      let txt = el.find("p").text();
      if (txt != "n.a.") {
        let priceToVerify = el.attr("data-price");
        let type = el.attr("data-type");
        let baseid = el.attr("data-id");
        let data = await getRuneInfo(type, baseid);
        let i = data[0];
        updateOne(i, type);

        let updatedTxt = el.find("p").text();
        if (updatedTxt != "n.a.") {
          if (parseInt(i.price) <= parseInt(priceToVerify)) {
            await addToCart(baseid, type, -1);
            cart = await getCart();
            updateCart(cart, userBalance);
            data = await getRuneInfo(type, baseid);
            i = data[0];
            updateOne(i, type);
          } else {
            //PRICE CHANGED -> NOTIFY USER (THIS SHOULD ACTUALLY NEVER HAPPEN ON OUT)
            await addToCart(baseid, type, -1);
            cart = await getCart();
            updateCart(cart, userBalance);
            data = await getRuneInfo(type, baseid);
            i = data[0];
            updateOne(i, type);
          }
        } else {
          //SOMEONE ELSE TOOK IT OUT NOTIFY USER
        }
      }
    } else {
      //THIS IS THE GOOGLE CLASS FOR THE BUTTON
      $(".abcRioButton").trigger("click");
    }
  });

  $(".trader-scroll").on("click", ".item-in", async function () {
    if (GoogleAuth != undefined) {
      let el = $(this);
      let txt = el.find("p").text();
      if (txt != "n.a.") {
        let priceToVerify = el.attr("data-price");
        let type = el.attr("data-type");
        let baseid = el.attr("data-id");
        let data = await getRuneInfo(type, baseid);

        let i = data[0];

        updateOne(i, type);

        let updatedTxt = el.find("p").text();
        if (updatedTxt != "n.a.") {
          if (parseInt(i.inprice) <= parseInt(priceToVerify)) {
            await addToCart(baseid, type, 1);
            cart = await getCart();
            updateCart(cart, userBalance);
            data = await getRuneInfo(type, baseid);
            i = data[0];
            updateOne(i, type);
          } else {
            //PRICE CHANGED -> NOTIFY USER (THIS SHOULD ACTUALLY NEVER HAPPEN ON OUT)
            await addToCart(baseid, type, 1);
            cart = await getCart();
            updateCart(cart, userBalance);
            data = await getRuneInfo(type, baseid);
            i = data[0];
            updateOne(i, type);
          }
        } else {
          //SOMEONE ELSE TOOK IT OUT NOTIFY USER
        }
      }
    } else {
      //THIS IS THE GOOGLE CLASS FOR THE BUTTON
      $(".abcRioButton").trigger("click");
    }
  });

  $(".cart-items").on("click", ".delete-item", async function () {
    let id = $(this).attr("data-baseid");
    let cartsid = $(this).attr("data-idcarts");
    let inOrOut = $(this).attr("data-inorout");
    let type = $(this).attr("data-type");
    let changetobalance = $(this).attr("data-changetobalance");
    let openTrades = await removeFromCart(id, type, inOrOut, cartsid);
    if (openTrades == false) {
      $(this).closest(".cart-item").remove();
    } else {
      //TODO user error can't change cart with open trades
    }

    if (changetobalance >= 0) {
      inValue = inValue - changetobalance;
      inOrOut = 1;
    } else {
      outValue = outValue + Math.abs(changetobalance);
      inOrOut = -1;
    }
    $(".newbalance-span").text(
      (userBalance + inValue + outValue).toLocaleString()
    );
    $(".total-out")
      .empty()
      .append(
        '<span data-totalout="' +
        outValue +
        '">- ' +
        Math.abs(outValue).toLocaleString() +
        " PP</span>"
      );
    $(".total-in")
      .empty()
      .append(
        '<span data-totalin="' +
        (userBalance + inValue) +
        '">+ ' +
        (userBalance + inValue).toLocaleString() +
        " PP</span>"
      );
    let data = await getRuneInfo(type, id);
    let i = data[0];
    updateOne(i, type);
  });

  paypal
    .Buttons({
      style: {
        shape: "rect",
        color: "gold",
        layout: "vertical",
        label: "paypal",
      },
      createOrder: async function () {
        if (GoogleAuth != undefined) {
          //$('.processing').addClass('flex');
          let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
          const res = await $.ajax({
            url: baseUrl + "create_transaction",
            type: "POST",
            dataType: "json",
            //contentType: 'application/json',
            data: {
              token: token,
              usd: ($("#paypal-points").val() / 100000).toFixed(2),
            },
            success: function (data) {
              return data;
            },
            error: function () {
              //$('.processing').removeClass(flex);
            },
          });
          console.log(res);
          return res.orderID;
        } else {
          showBannerError("Log in please");
        }
        // Use the same key name for order ID on the client and server
      },
      onApprove: function (d) {
        if (GoogleAuth != undefined) {
          let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
          $.ajax({
            url: baseUrl + "buy_pp",
            type: "POST",
            dataType: "json",
            //contentType: 'application/json',
            data: { token: token, orderID: d.orderID },
            success: async function (data) {
              console.log("Transaction succeeded");
              $("#paypal").hide();
              //$('.processing').removeClass('flex');
              $("#snogvie-success").addClass("flex");

              setTimeout(function () {
                $("#overlay").hide();
                $("#snogvie-success").removeClass("flex");
              }, 2000);

              await onSignIn();
            },
          });
        } else {
          showBannerError("Log in please");
        }
      },
    })
    .render("#paypal-buttons");

  $("#paypal-points").on("keyup change", function () {
    let points = $(this).val();
    let usd = (points / 100000 + 0.5).toFixed(2);
    $(".paypal-usd").text(parseFloat(usd).toLocaleString() + " USD");
  });

  $(".buy-pp").on("click", function () {
    $("#paypal").toggle();
    $("#overlay").toggle();
  });

  $(".cart-toggle").on("click", function () {
    $(".cart").toggleClass("flex");
    $("#overlay").toggle();
  });

  $("#overlay").on("click", function () {
    $("#paypal").hide();
    $("#paypal-buttons").empty();
    paypal
      .Buttons({
        style: {
          shape: "rect",
          color: "gold",
          layout: "vertical",
          label: "paypal",
        },
        createOrder: async function () {
          if (GoogleAuth != undefined) {
            //$('.processing').addClass('flex');
            let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            const res = await $.ajax({
              url: baseUrl + "create_transaction",
              type: "POST",
              dataType: "json",
              //contentType: 'application/json',
              data: {
                token: token,
                usd: ($("#paypal-points").val() / 100000).toFixed(2),
              },
              success: function (data) {
                return data;
              },
              error: function () {
                //$('.processing').removeClass(flex);
              },
            });
            console.log(res);
            return res.orderID;
          } else {
            showBannerError("Log in please");
          }
          // Use the same key name for order ID on the client and server
        },
        onApprove: function (d) {
          if (GoogleAuth != undefined) {
            let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            $.ajax({
              url: baseUrl + "buy_pp",
              type: "POST",
              dataType: "json",
              //contentType: 'application/json',
              data: { token: token, orderID: d.orderID },
              success: async function (data) {
                console.log("Transaction succeeded");
                $("#paypal").hide();
                //$('.processing').removeClass('flex');
                $("#snogvie-success").addClass("flex");

                setTimeout(function () {
                  $("#overlay").hide();
                  $("#snogvie-success").removeClass("flex");
                }, 2000);

                await onSignIn();
              },
            });
          } else {
            showBannerError("Log in please");
          }
        },
      })
      .render("#paypal-buttons");
    //$('.processing').removeClass('flex');
    $("#snogvie-success").removeClass("flex");
    if ($(window).width() < 1025) {
      $(".cart").hide();
      $(".cart").removeClass("flex");
    }
    $("#overlay").hide();
  });

  /*  $('.paypal-button').on('click', function(){
        let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
        let usd = ($('#paypal-points').val() / 100000).toFixed(2);
        let data = {'usd': usd, 'token': token};
        $.ajax({
            url: baseUrl + "buy_pp",
            type: "POST",
            dataType:'json',
            data: data,
            success: function(data){
                console.log(data);
            }
        });
    }); */
});

function showBannerError(err) {
  $(".banner-error p").text(err);
  $(".banner-error").show();
  setTimeout(function () {
    $(".banner-error").hide();
  }, 3000);
}

async function removeFromCart(id, t, inOrOut, cartsId) {
  let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
  let data = {
    type: t.toString(),
    baseid: id.toString(),
    token: token,
    inorout: inOrOut,
    cartsid: cartsId,
  };

  let openTrades;
  await $.ajax({
    url: baseUrl + "remove_from_cart",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      console.log("no error");
      openTrades = false;
    },
    error: function (data) {
      console.log("error");
      openTrades = true;
    },
  });
  console.log(openTrades);
  return openTrades;
}

async function getCart() {
  let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
  let data = { token: token };
  let r = await $.ajax({
    url: baseUrl + "get_cart",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      return data;
    },
  });
  return r;
}

async function addToCart(id, t, inOrOut) {
  let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
  let data = {
    type: t.toString(),
    baseid: id.toString(),
    token: token,
    inorout: inOrOut,
  };

  await $.ajax({
    url: baseUrl + "add_to_cart",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      return data;
    },
    complete: async function (d) {
      if (
        d.responseText != "" &&
        d.responseText != null &&
        d.responseText != undefined
      ) {
        let textToShow = d.responseText;
        $(".check-out-message p").text(textToShow);
        $(".check-out-message").removeClass("accepted");
        $(".check-out-message").removeClass("denied");
        $(".check-out-message").addClass("denied");
        $(".check-out-message").show();
        setTimeout($(".check-out-message").hide(), 1000);
      }
    },
  });
}

async function updateOne(i, t) {
  let dataInprice = i.inprice;
  let dataOutPrice = i.price;
  let outPrice;
  let inPrice;
  if ($(window).width() < 1025) {
    outPrice = Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      notation: "compact",
      compactDisplay: "short",
    }).format(i.price);
    inPrice = Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      notation: "compact",
      compactDisplay: "short",
    }).format(i.inprice);
  } else {
    outPrice = i.price.toLocaleString();
    inPrice = i.inprice.toLocaleString();
  }

  let tradeOut = "";
  let tradeIn = '<p class="price">+' + inPrice + "</p>";

  if (i.instock == 1) {
    tradeOut = '<p class="price">-' + outPrice + "</p>";
  } else {
    tradeOut = '<p class="na">n.a.</p>';
  }

  let baseid = "";

  switch (parseInt(t)) {
    case 1:
      //imagesrc = 'https://d2aao99y1mip6n.cloudfront.net/images/runes/idols/'+i.hash+'.gif';
      baseid = i.basechampid;
      break;
    case 2:
      //imagesrc = 'https://d2aao99y1mip6n.cloudfront.net/images/runes/sm/'+i.hash+'.png';
      baseid = i.basespellid;
      break;
    case 3:
      //imagesrc = 'https://d2aao99y1mip6n.cloudfront.net/images/runes/sm/'+i.hash+'.png';
      baseid = i.baseequipid;
      break;
    case 4:
      //imagesrc = 'https://d2aao99y1mip6n.cloudfront.net/images/runes/idols/'+i.hash+'.gif';
      baseid = i.baserelicid;
      break;
  }
  setTimeout(function () {
    $('.item-out[data-id="' + baseid + '"][data-type="' + t.toString() + '"] ')
      .attr("data-price", dataOutPrice)
      .empty()
      .append(tradeOut);
    $('.item-in[data-id="' + baseid + '"][data-type="' + t.toString() + '"] ')
      .attr("data-price", dataInprice)
      .empty()
      .append(tradeIn);
  }, 0);
}
function refreshPrices() {
  if (!document.hidden) {
    // do what you need

    let type = $("#type").val();
    let faction = $("#faction").val();
    let rarity = $("#rarity").val();

    if (rarity == "-1") {
      rarity = "";
    }
    if (faction == "-1") {
      faction = "";
    }
    if (parseInt(type) <= 4) {
      $("#faction").css("opacity", 100);
      $("#rarity").css("opacity", 100);
      updatePrices(type, faction, rarity);
    } else {
      $("#faction").css("opacity", 0);
      $("#rarity").css("opacity", 0);
      //TODO: getToken / getTickets
    }
  }
}

async function getRuneInfo(t, id) {
  let data = { type: t.toString(), baseid: id.toString() };

  let r = await $.ajax({
    url: baseUrl + "get_runeinfo",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      return data;
    },
  });
  return r;
}

function updatePrices(t, f, r) {
  let data = {
    type: t.toString(),
    faction: f.toString(),
    rarity: r.toString(),
  };

  $.ajax({
    url: baseUrl + "get_runes",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      for (i of data) {
        updateOne(i, t);
      }
    },
  });
}

function getRunes(t, f, r) {
  let data = {
    type: t.toString(),
    faction: f.toString(),
    rarity: r.toString(),
  };
  $(".trader-scroll").empty();
  $(".trader-scroll").append('<div class="loading"><p>Loading...</p></div>');
  $.ajax({
    url: baseUrl + "get_runes",
    type: "POST",
    dataType: "json",
    data: data,
    success: function (data) {
      $(".trader-scroll").empty();
      //$('.trader-scroll').append('<div class="info"><p>Trade <b>IN</b> prices can fluctuate slightly.<br>They are verified on check-out.</p></div>')
      if (data.length > 0) {
        for (i of data) {
          let dataInprice = i.inprice;
          let dataOutPrice = i.price;
          let outPrice;
          let inPrice;
          if ($(window).width() < 1025) {
            /* outPrice = abbreviateNumber(i.price);
                        inPrice = abbreviateNumber(i.inprice); */
            outPrice = Intl.NumberFormat("en-US", {
              maximumFractionDigits: 1,
              notation: "compact",
              compactDisplay: "short",
            }).format(i.price);
            inPrice = Intl.NumberFormat("en-US", {
              maximumFractionDigits: 1,
              notation: "compact",
              compactDisplay: "short",
            }).format(i.inprice);
          } else {
            outPrice = i.price.toLocaleString();
            inPrice = i.inprice.toLocaleString();
          }

          let tradeOut = "";

          if (i.instock == 1) {
            tradeOut = '<p class="price">-' + outPrice + "</p>";
          } else {
            tradeOut = '<p class="na">n.a.</p>';
          }

          let factionOne;
          let factionTwo;

          let factions = i.factions.split(",");

          if (factions.length == 2) {
            for (let i = 0; i < factions.length; i++) {
              if (i == 0) {
                factionOne = getFaction(factions[i]);
              }
              if (i == 1) {
                factionTwo = getFaction(factions[i]);
              }
            }
          } else {
            factionOne = getFaction(factions[0]);
            factionTwo = getFaction(factions[0]);
          }

          let imagesrc = "";
          let rounded = "";

          let baseid = "";

          switch (parseInt(t)) {
            case 1:
              imagesrc =
                "https://d2aao99y1mip6n.cloudfront.net/images/runes/idols/" +
                i.hash +
                ".gif";
              baseid = i.basechampid;
              break;
            case 2:
              imagesrc =
                "https://d2aao99y1mip6n.cloudfront.net/images/runes/sm/" +
                i.hash +
                ".png";
              baseid = i.basespellid;
              break;
            case 3:
              imagesrc =
                "https://d2aao99y1mip6n.cloudfront.net/images/runes/sm/" +
                i.hash +
                ".png";
              baseid = i.baseequipid;
              break;
            case 4:
              imagesrc =
                "https://d2aao99y1mip6n.cloudfront.net/images/runes/idols/" +
                i.hash +
                ".gif";
              baseid = i.baserelicid;
              break;
          }
          $(".trader-scroll").append(
            '<div class="item" baseid="' +
            i.basechampid +
            '"><div class="rarity ' +
            i.rarity.toLowerCase() +
            '"></div><div class="item-image"><img alt="" loading="lazy" src="' +
            imagesrc +
            '"></div>  <div class="item-faction"><div class="faction-one ' +
            factionOne +
            '"></div><div class="faction-two ' +
            factionTwo +
            '"></div></div>    <div class="item-name"><p>' +
            i.name +
            '</p></div><div class="item-out" data-id="' +
            baseid +
            '" data-type="' +
            t +
            '" data-price="' +
            dataOutPrice +
            '">' +
            tradeOut +
            '</div><div class="item-in"  data-id="' +
            baseid +
            '" data-type="' +
            t +
            '" data-price="' +
            dataInprice +
            '"><p class="price">+' +
            inPrice +
            "</p></div>  </div>"
          );
        }
      } else {
        $(".trader-scroll").append('<p class="loading">Nothing found</p>');
      }
    },
  });
}

function getFaction(i) {
  let faction = "";
  switch (parseInt(i)) {
    case 1:
      faction = "fw";
      break;
    case 2:
      faction = "ud";
      break;
    case 3:
      faction = "sl";
      break;
    case 4:
      faction = "sp";
      break;
    case 5:
      faction = "fs";
      break;
    case 6:
      faction = "is";
      break;
    case 7:
      faction = "kf";
      break;
    case 8:
      faction = "st";
      break;
    default:
      faction = "";
  }
  return faction;
}

function renderButton() {
  gapi.signin2.render("my-signin2", {
    scope: "profile email",
    width: 105,
    height: 40,
    longtitle: false,
    theme: "light",
    onsuccess: onSignIn,
    onfailure: onFailure,
  });
}

function onFailure(err) {
  console.log(err);
}

async function onSignIn() {
  GoogleAuth = gapi.auth2.getAuthInstance();
  //console.log(GoogleAuth.currentUser);
  let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
  $.ajax({
    url: baseUrl + "signin",
    type: "POST",
    dataType: "json",
    data: { token: token },
    success: async function (data) {
      userBalance = data[0].points;
      //$('.total-in').html('<span data-totalin="'+userBalance+'">+ '+userBalance.toLocaleString()+' PP</span>')
      cart = await getCart();
      updateCart(cart, userBalance);
    },
  });
}

function updateCart(c, b) {
  inValue = 0;
  outValue = 0;
  userBalance = b;
  $(".cart-items").empty();
  $(".cart-items").append('<div class="cart-info"><p>Loading...</p></div>');
  console.log(c);
  if (c.length == 0) {
    $(".cart-items").empty();
    $(".cart-items").append(
      '<div class="cart-info"><p>Cart is empty</p></div>'
    );
  } else {
    $(".cart-items").empty();
    for (i of c) {
      let inOrOut;
      if (i.changetobalance >= 0) {
        inValue = inValue + i.changetobalance;
        inOrOut = 1;
      } else {
        outValue = outValue + i.changetobalance;
        inOrOut = -1;
      }
      $(".cart-items").append(
        '<div class="cart-item"><div data-changetobalance="' +
        i.changetobalance +
        '" data-inorout="' +
        inOrOut +
        '" data-type="' +
        i.type +
        '" data-baseid="' +
        i.baseid +
        '" data-idcarts="' +
        i.idcarts +
        '" class="delete-item"><img src="icons/delete.svg"/></div><p class="cart-name">' +
        i.name +
        '</p><p class="cart-price">' +
        (inOrOut > 0 ? "+ " : "") +
        i.changetobalance.toLocaleString() +
        " PP</p></div>"
      );
    }
  }
  $(".newbalance-span").text(
    (userBalance + inValue + outValue).toLocaleString()
  );
  $(".total-out")
    .empty()
    .append(
      '<span data-totalout="' +
      outValue +
      '">- ' +
      Math.abs(outValue).toLocaleString() +
      " PP</span>"
    );
  $(".total-in")
    .empty()
    .append(
      '<span data-totalin="' +
      (userBalance + inValue) +
      '">+ ' +
      (userBalance + inValue).toLocaleString() +
      " PP</span>"
    );
}

function fullTrade() {
  //HAPPENS ON BUTTON CLICK
  //LOGIN SHOULD COME FROM INPUT
  let login = [
    { username: $("#pox-username").val(), password: $("#pox-pw").val() },
  ];
  let tradeid = $("#trade-id").val();

  //CHECK IF WE HAVE EVERYTHING NEEDED TO MAKE THE TRADE
  if ((login[0].username != "" && login[0].password != "") || tradeid != "") {
    GoogleAuth = gapi.auth2.getAuthInstance();
    let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
    let allData = { login: login, tradeUrl: tradeid, token: token };
    trade(allData);
  } else {
    //TELL USER WE NEED OR TRADELINK OR USERNAME AND PW
  }
}

function trade(allData) {
  $(".check-out-message p").text(
    "Processing your trade. Please wait until done."
  );
  $(".check-out-message").removeClass("accepted");
  $(".check-out-message").removeClass("denied");
  $(".check-out-message").addClass("accepted");
  $(".check-out-message").show();
  $.ajax({
    url: baseUrl + "maketrade",
    type: "POST",
    dataType: "json",
    data: allData,
    complete: async function (data) {
      //CAN BE SUCCESS OR ERROR MESSAGE
      console.log("Test");
      let textToShow = data.responseText;
      if (textToShow.includes("Success")) {
        $(".check-out-message p").text(textToShow);
        $(".check-out-message").removeClass("accepted");
        $(".check-out-message").removeClass("denied");
        $(".check-out-message").addClass("accepted");
        $(".cart-items").empty();
        openTradesChecker = setInterval(checkOpenTrades, 10 * 1000);
      } else {
        $(".check-out-message p").text(textToShow);
        $(".check-out-message").removeClass("accepted");
        $(".check-out-message").removeClass("denied");
        $(".check-out-message").addClass("denied");
        setTimeout(function () {
          $(".check-out-message").hide();
        }, 10 * 1000);
      }
    },
  });
}

function checkOpenTrades() {
  let openTrades = 1;
  GoogleAuth = gapi.auth2.getAuthInstance();
  let token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
  $.ajax({
    url: baseUrl + "signin",
    type: "POST",
    dataType: "json",
    data: { token: token },
    success: async function (data) {
      openTrades = data[0].opentrades;
      if (parseInt(openTrades) == 0) {
        $(".check-out-message").hide();
        clearInterval(openTradesChecker);
        inValue = 0;
        outValue = 0;
        userBalance = data[0].points;
        newBalance = data[0].points;
        $(".newbalance-span").text(
          (userBalance + inValue + outValue).toLocaleString()
        );
        $(".total-out")
          .empty()
          .append(
            '<span data-totalout="' +
            outValue +
            '">- ' +
            Math.abs(outValue).toLocaleString() +
            " PP</span>"
          );
        $(".total-in")
          .empty()
          .append(
            '<span data-totalin="' +
            (userBalance + inValue) +
            '">+ ' +
            (userBalance + inValue).toLocaleString() +
            " PP</span>"
          );
      }
    },
  });
}

function updateDb(pw) {
  $.ajax({
    url: baseUrl + "update_db",
    type: "POST",
    //dataType:'json',
    data: { pw: pw },
    success: function (data) {
      console.log(data);
    },
  });
}

function updateStock(pw) {
  $.ajax({
    url: baseUrl + "update_stock",
    type: "POST",
    //dataType:'json',
    data: { pw: pw },
    success: function (data) {
      console.log(data);
    },
    error: function (e) {
      console.log(e);
    },
  });
}

function updateStockLim(pw) {
  $.ajax({
    url: baseUrl + "update_stock_lim",
    type: "POST",
    //dataType:'json',
    data: { pw: pw },
    success: function (data) {
      console.log(data);
    },
    error: function (e) {
      console.log(e);
    },
  });
}

function userStock(user, pw) {
  $.ajax({
    url: baseUrl + "user_stock",
    type: "POST",
    dataType: "json",
    data: { user: user, pw: pw },
    success: function (data) {
      console.log(data);
    },
  });
}

function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}

//USE IF SMALL SCREEN
function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "k", "m", "b", "t"];
    var suffixNum = Math.floor(("" + value).length / 3);
    var shortValue = "";
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat(
        (suffixNum != 0
          ? value / Math.pow(1000, suffixNum)
          : value
        ).toPrecision(precision)
      );
      var dotLessShortValue = (shortValue + "").replace(/[^a-zA-Z 0-9]+/g, "");
      if (dotLessShortValue.length <= 2) {
        break;
      }
    }
    if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    newValue = shortValue + suffixes[suffixNum];
  }
  return newValue;
}
