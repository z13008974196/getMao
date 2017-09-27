// zoom
var window_height,screenPer,screenHeight,headHeight;
function zoom(){
    window_height = $(window).height();
    screenPer = window_height / 1080;
    headHeight = parseInt(100*screenPer);
    screenHeight = window_height - headHeight;
    $(".pageHead").css("zoom",screenPer);
    $("item").css({
        "padding-top": headHeight,
        "height": screenHeight
    });
    $(".item").children().css("zoom",screenPer);
}
