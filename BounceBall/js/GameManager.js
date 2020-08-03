// class of game manager. It also manages frame animations.
GameManager = function (block_size, bonus_radius, bounce_radius) {
    // initialize the game board
    this.block_size = block_size; // block size in pixels
    // set the height of the game board
    var h = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    h = Math.ceil(0.9 * h / this.block_size) * this.block_size;
    document.querySelector('.game-container').style.height = h + 'px';

    this.bonus_radius = bonus_radius; // bonus radius in pixels
    var w = document.querySelector('.game-container').clientWidth;
    this.width = Math.floor(w / this.block_size); // number of columns
    this.height = Math.ceil(h / this.block_size); // number of rows
    this.board = new Board(this.width, this.height, this.block_size, this.bonus_radius);

    // initialize the bounce ball
    this.bounce_real_radius = bounce_radius; // bounce ball radius in pixels
    this.bounce_border = 0.5; // the mantle for collision
    this.bounce_radius = this.bounce_real_radius + this.bounce_border; // collisive radius
    // initial position in pixels
    this.bounce_init_position = {
        left: this.block_size * this.width / 2 - this.bounce_real_radius,
        top: this.block_size * (this.height - 0.5) - this.bounce_real_radius - 10
    };
    this.unit_v = 0.5; // scale of velocity
    this.step_every = 20; // how many movements per keyframe
    this.eject_every = 20; // how many frames to eject a new ball

    // array of bounce balls
    this.bounce_balls = [new BounceBall(this.bounce_radius,
        this.bounce_init_position, { left: 0, top: 0 })];
    this.bounce_num = 1; // number of bounce balls

    // initialize the HTMLManager
    this.HManager = new HTMLManager(this.board, this.bounce_balls);
    this.movedown_frame = 30; // frames for block to move down

    // initialize the level
    this.level = 0;
    this.losed = false; // game state

    // initialize the score
    this.score = 0;

    // initialize the mouse manager
    this.MManager = new MouseManager();
    this.MManager.on('restart', this.new_game.bind(this));
    this.MManager.on('eject', this.bouncing.bind(this));

    // start the game!
    this.next_level();
}

// initialize the game
GameManager.prototype.new_game = function () {
    var self = this;
    this.losed = false;
    while (this.bounce_balls.length > 0)
        this.bounce_balls.pop();
    this.bounce_balls.push(new BounceBall(this.bounce_radius,
        this.bounce_init_position, { left: 0, top: 0 }));
    this.board.clear();
    this.bounce_num = 1;
    this.level = 0;
    this.score = 0;
    this.HManager.clear(self.bounce_num, self.score);
    this.next_level();
}

// producing the next level
GameManager.prototype.next_level = function () {
    this.MManager.SetAnimation();
    var self = this;
    var step = this.block_size / this.movedown_frame;
    this.HManager.new_bounce_balls();
    this.board.next_level(this.level);
    if (self.IsLose()) {
        self.losed = true;
        self.HManager.ShowLose();
        this.MManager.CancelAnimation();
        return;
    }
    this.HManager.new_row();
    this.level += 1;
    var stamp = this.movedown_frame;
    var next_level_anim = function () {
        stamp -= 1;
        self.HManager.move_all_frame(step);
        if (stamp > 0) {
            requestAnimationFrame(next_level_anim);
            return;
        }
        requestAnimationFrame(function () {
            self.HManager.move_all();
        });
    }
    requestAnimationFrame(next_level_anim);
    this.MManager.CancelAnimation();
}

// judge whether player loses the game
GameManager.prototype.IsLose = function () {
    return this.board.is_broken();
}

// move single ball wrapper
GameManager.prototype.move_ball = function (idx) {
    var ball = this.bounce_balls[idx];
    var ball_ele = document.getElementById('ball-' + idx);
    // retrieve the ball
    if (ball.IsBottom(this.board))
        ball.displace(this.bounce_init_position);
    else {
        var hit_result = ball.step_move(this.board);
        var hit_bonus = hit_result.bonus;
        var hit_block = hit_result.block;
        if (hit_block) {
            this.board.hit_block(hit_block);
            this.HManager.hit_block(hit_block);
            this.score += 1;
        }
        if (hit_bonus) {
            this.board.hit_bonus_ball(hit_bonus);
            this.HManager.hit_bonus(hit_bonus);
            this.bounce_num += 1;
        }
    }
}

// calculate the velocity
GameManager.prototype.eject_v = function (event) {
    var vX = event.offsetX - this.bounce_init_position.left - this.bounce_radius;
    var vY = event.offsetY - this.bounce_init_position.top - this.bounce_radius;
    var len = Math.sqrt(vX * vX + vY * vY);
    return {
        left: vX * this.unit_v / len,
        top: vY * this.unit_v / len
    };
}

// all balls retrieved?
GameManager.prototype.retrieved = function () {
    var self = this;
    return this.bounce_balls.every(function (val) {
        return Math.abs(val.left - self.bounce_init_position.left) <= 1.0 &&
            Math.abs(val.top - self.bounce_init_position.top) <= 1.0;
    });
}

// initialize the balls' status
GameManager.prototype.initial_balls = function () {
    var self = this;
    this.bounce_balls.forEach(function (val) {
        val.left = self.bounce_init_position.left;
        val.top = self.bounce_init_position.top;
        val.v_left = val.v_top = 0.0;
    });
    while (this.bounce_balls.length < this.bounce_num)
        this.bounce_balls.push(new BounceBall(this.bounce_radius,
            this.bounce_init_position, { left: 0, top: 0 }));
}

// make the bouncing process
GameManager.prototype.bouncing = function (event) {
    // calculate the initial velocity
    var init_v = this.eject_v(event);
    //  can't eject below, can't play if you lose :(
    if (init_v.top >= 0 || this.losed) {
        this.MManager.CancelAnimation();
        return;
    }
    var self = this;
    var ejected = 0;
    var timestamp = 0;
    var anim = function () {
        timestamp += 1;
        // eject a ball
        if (ejected < self.bounce_balls.length && timestamp % self.eject_every == 1) {
            self.bounce_balls[ejected].setV(init_v);
            ejected += 1;
        }
        // move all balls
        for (var i = 0; i < self.step_every; i++)
            for (var j = 0; j < self.bounce_balls.length; j++)
                self.move_ball(j);
        self.HManager.move_all_balls();
        // a round off
        if (self.retrieved()) {
            self.initial_balls();
            self.HManager.UpdateScore(self.score);
            self.HManager.UpdateBallNum(self.bounce_num);
            self.MManager.CancelAnimation();
            // next level!
            if (!self.MManager.ButtonPress)
                self.next_level();
            // this is restart state
            else
                self.MManager.CancelButtonPress();
        }
        // next frame
        else
            requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
}