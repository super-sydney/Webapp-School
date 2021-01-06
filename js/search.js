function initSearchPage() {
  initQueryStrings();
  var q = location.queryString['q'];
  $("#search").val(q);

  $('#search').keypress(
    function(ev) {
      search();
    }
  )
}

function search() {
  var search = $("#search")
  if (search != null) {
    var q = search.val().toLowerCase();
    $(".person").each(
      function() {
        $(this).toggle(
          $(this).text().toLowerCase().indexOf(q) != -1
        );
      }
    );
  }
}

function initQueryStrings() {
  location.queryString = {};
  location.search.substr(1).split("&").forEach(
    function(pair) {
      if (pair === "") return;
      var parts = pair.split("=");
      location.queryString[parts[0]] = parts[1] && decodeURIComponent(parts[1].replace(/\+/g, " "));
    }
  );
}

$(document).ready(
  function() {
    if ($("#search").length) {
      initSearchPage();
      search();
    }
  }
);