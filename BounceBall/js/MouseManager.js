// MouseManager
function MouseManager() {
    this.event = {};
    this.OnAnimation = false; // whether the animation is ongoing
    this.ButtonPress = false; // whether the button is pressed
    this.game_container = document.querySelector('.game-container');
    this.listen();
}

// event and the triggering
MouseManager.prototype.on = function (event, callback) {
    if (!this.event[event])
        this.event[event] = [];
    this.event[event].push(callback);
}

// do callback when the event is triggered
MouseManager.prototype.emit = function (event, data) {
    var callbacks = this.event[event];
    if (callbacks)
        callbacks.forEach(function (callback) { callback(data); });
}

// bind the events
MouseManager.prototype.bindPress = function (selector, fn) {
    var ele = document.querySelector(selector);
    ele.addEventListener('click', fn.bind(this));
}

// manage restart
MouseManager.prototype.restart = function (event) {
    this.SetButtonPress();
    this.emit('restart');
}

// set and reset OnAnimation
MouseManager.prototype.SetAnimation = function () {
    this.OnAnimation = true;
}
MouseManager.prototype.CancelAnimation = function () {
    this.OnAnimation = false;
}

// set and reset ButtonPressed
MouseManager.prototype.SetButtonPress = function () {
    this.ButtonPress = true;
}
MouseManager.prototype.CancelButtonPress = function () {
    this.ButtonPress = false;
}

// listen for mouse click
MouseManager.prototype.listen = function () {
    var self = this;
    this.game_container.addEventListener('click', function (event) {
        if (self.ButtonPress) {
            self.CancelButtonPress();
            return;
        }
        if (self.OnAnimation)
            return;
        self.SetAnimation();
        self.emit('eject', event);
    })
    this.bindPress('.restart-button', this.restart);
    this.bindPress('.retry-button', this.restart);
}