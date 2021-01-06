/* Shopping cart */
function showCart() {
    var cart = getCartFromSession();
    var items = cart.items

    var cartStr = `
<div class="grid-container-cart cart-head">
<div>Item</div>
<div>Aantal</div>
<div>Prijs</div>
<div></div>
</div>
`;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemStr =
            `<div class="grid-container-cart cart-item" product="${item.name}">
<div class="cart-kol">${item.name}</div>
<div><input class="spinner" data-role="none" value=${item.quantity}></div>
<div class="price cart-kol">${displayAmount(item.price)}</div>
<button class="ui-btn ui-corner-all ui-icon-delete ui-btn-icon-notext"></button>
</div>`;
        cartStr = cartStr + itemStr;
    }
    var cartHtml = $("#cart").html(cartStr);
    cartHtml.find("button.ui-icon-delete")
        .click(
            function () {
                var item = $(this).closest(".cart-item");
                var productName = $(item.get(0)).attr("product");
                removeFromCart(productName);
                showCart();
            }
        );

    cartHtml.find(".cart-item input.spinner")
        .spinner(
            {
                min: 1,
                max: 10,
                stop: function (event, ui) {
                    var newValue = this.value;
                    if (newValue > 10) {
                        $(this).spinner("value", 10);
                        return false;
                    } else if (newValue < 1) {
                        $(this).spinner("value", 1);
                        return false;
                    }
                    var item = $(this).closest(".cart-item");
                    if (item.length) {
                        var productName = $(item.get(0)).attr("product");
                        updateQuantiyInCart(productName, this.value);
                        setTimeout(function () {
                            showCart();
                        }, 100);
                    }
                }
            }
        );

    $("#total").html(`<b>&euro;${displayAmount(cart.total)}</b>`)
}

function updateQuantiyInCart(productName, quantity) {
    var cart = getCartFromSession();
    var items = cart.items;
    var item = items.find(
        function (itemVar) {
            return itemVar.name == productName;
        }
    );
    if (item != null) {
        cart.total = round(cart.total - item.price * item.quantity);
        cart.total = round(cart.total + item.price * quantity);

        item.quantity = quantity;
        saveCartToSession(cart);
    }

}

function removeFromCart(productName) {
    var cart = getCartFromSession();

    var items = cart.items;
    var item = items.find(
        function (itemVar) {
            return itemVar.name == productName;
        }
    );
    if (item != null) {
        // trek bedrag af van totaal
        cart.total = round(cart.total - item.price * item.quantity);

        // verwijder item in array item
        var index = items.indexOf(item);
        items.splice(index, 1);
    }
    saveCartToSession(cart);
    showCart();
}

function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

function displayAmount(numberVar) {
    var numberStr = numberVar.toFixed(2);
    numberStr = numberStr.replace('.', ',');
    return numberStr;
}

function addToCart(productName, productPrice) {
    var cart = getCartFromSession();
    var items = cart.items;
    var item = items.find(
        function (itemVar) {
            return itemVar.name == productName;
        }
    );
    if (item == null) {
        item = {
            name: productName,
            quantity: 1,
            price: productPrice
        };
        items.push(item);
    } else {
        item.quantity = item.quantity + 1;
    }
    cart.total = round(cart.total + productPrice);
    saveCartToSession(cart);
}

function cartIsEmpty() {
    return getCartFromSession().items.length <= 0;
}

function getCartFromSession() {
    var cart = null;
    var cartStr = sessionStorage.getItem('knutsel-cart');
    if (cartStr != null) {
        cart = JSON.parse(cartStr);
    } else {
        cart = {
            items: [],
            total: 0.0
        };
    }
    return cart;
}

function saveCartToSession(cart) {
    var cartStr = JSON.stringify(cart);
    sessionStorage.setItem('knutsel-cart', cartStr);
}

/* checkout */

var checkoutData = {};

function checkoutOK() {
    return notEmpty(checkoutData.name) && notEmpty(checkoutData.email) && notEmpty(checkoutData.address)
        && notEmpty(checkoutData.zipcode) && notEmpty(checkoutData.city)
        && notEmpty(checkoutData.creditCardNumber) && notEmpty(checkoutData.creditCardName)
        && notEmpty(checkoutData.creditCardExpiryYear) && notEmpty(checkoutData.creditCardExpiryMonth)
        && notEmpty(checkoutData.creditCardCvv);
}

function notEmpty(value) {
    return value != null && value.length > 0;
}

function bindCheckout() {
    var bindings = $("[data-bind]");
    // update checkout data vanuit formulier
    bindings.each(function() {
        var elm = $(this);
        var id = elm.data("bind");
        var value = elm.val();
        checkoutData[id] = value;
    });
    // wijzig checkout data bij wijziging in formulier
    bindings.change(function() {
        var elm = $(this);
        var id = elm.data("bind");
        var value = elm.val();
        checkoutData[id] = value;
    });
}

function sendOrder() {
    if (checkoutOK()) {
        var cart = getCartFromSession();
        if (cart.items.length > 0) {
            // json bestelling wordt gepost naar php
            $.ajax({
                    url: "bestellen.php",
                    method: "POST",
                    processData: false,
                    data: JSON.stringify({
                        cart: cart,
                        checkout: checkoutData
                    })
                }
            ).done(function (res) {
                // verwijder alle data na succesvolle bestelling
                checkoutData = {};
                sessionStorage.removeItem('knutsel-cart');
                // ga naar succes pagina
                $.mobile.pageContainer.pagecontainer("change", "#bestelling-succes");
            }).fail(function ( jqXHR, textStatus) {
                console.log( "Request failed: " + textStatus );
            });
        } else {
            // ga naar pagina mand
            $.mobile.pageContainer.pagecontainer("change", "#mand");
        }
    } else {
        // open error pagina
        $("#checkout-error").popup("open");
    }
}

/* contact */

function sendContact() {
    var name = $("#name").val();
    var email = $("#email").val();
    var question = $("#question").val();

    if (notEmpty(name) && notEmpty(email) && notEmpty(question)) {
        // json contact wordt gepost naar php
        $.ajax({
                url: "contact.php",
                method: "POST",
                processData: false,
                data: JSON.stringify({
                    name: name,
                    email: email,
                    question: question
                })
            }
        ).done(function (res) {
            console.log( "Request succesful");
        }).fail(function ( jqXHR, textStatus) {
            console.log( "Request failed: " + textStatus );
        });
        $("#bedankt").popup("open");
    } else {
        $("#error").popup("open");
    }
}

/* speelgoed */

function initSpeelgoed() {
    $(document).ready(
        function () {
            $(".add-to-cart").click(
                function () {
                    var price = Number($(this).attr("price"));
                    var product = $(this).attr("product");
                    addToCart(product, price);
                }
            );
        }
    );
}

/* searchbar */

function initSearchPage() {
    initQueryStrings();
    var q = location.queryString['q'];
    $("#search").val(q);

    $('#search').keypress(
        function (ev) {
            // return
            if (ev.which === 13) {
                $('#searchButton').click();
                return true;
            }
            search();
        }
    ).keydown(
        function (ev) {
            // delete, backspace
            if (event.keyCode == 46 || event.keyCode == 8) {
                search();
            }
        }
    ).change(
        // delete met kruis
        function () {
            search();
        }
    );
}

function search() {
    var search = $("#search")
    if (search != null) {
        var q = search.val().toLowerCase();
        $(".product").each(
            function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(q) > -1)
            }
        );
    }
}

function gotoSearch() {
    var q = $("#search").val().toLowerCase();
    window.location.href = "./speelgoed.html?q=" + q;
}

function initQueryStrings() {
    location.queryString = {};
    location.search.substr(1).split("&").forEach(
        function (pair) {
            if (pair === "") return;
            var parts = pair.split("=");
            location.queryString[parts[0]] = parts[1] && decodeURIComponent(parts[1].replace(/\+/g, " "));
        }
    );
}

$(document).ready(
    function () {
        if ($("#search").length) {
            initSearchPage();
            search();
        }
    }
);

// prevent content covered by header
$(window).on('load', function () { $(this).trigger('resize'); });


// When the user clicks on the button, scroll to the top of the document
function gotoTop() {
  document.getElementById("titel").scrollIntoView();
  return false;
}

/* Slides */

var slideIndex = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
var slideId = ["mySlides1", "mySlides2", "mySlides3","mySlides4","mySlides5","mySlides6","mySlides7","mySlides8","mySlides9","mySlides10","mySlides11","mySlides12","mySlides13","mySlides14", "mySlides15", "mySlides16"]

function plusSlides(n, no) {
  showSlides(slideIndex[no] += n, no);
}

function showSlides(n, no) {
  var i;
  var x = document.getElementsByClassName(slideId[no]);
  if (n > x.length) {slideIndex[no] = 1}    
  if (n < 1) {slideIndex[no] = x.length}
  for (i = 0; i < x.length; i++) {
     x[i].style.display = "none";  
  }
  x[slideIndex[no]-1].style.display = "block";
}
