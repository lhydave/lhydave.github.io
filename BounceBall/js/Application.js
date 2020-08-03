requestAnimationFrame(function () {
    var w = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
    var block_size, bonus_radius, bounce_radius;
    if (w <= 320) // run on the phone
    {
        block_size = 50;
        bonus_radius = 11;
        bounce_radius = 8;
    }
    else // a bigger screen
    {
        block_size = 66;
        bonus_radius = 15;
        bounce_radius = 10;
    }
    new GameManager(block_size, bonus_radius, bounce_radius);
});