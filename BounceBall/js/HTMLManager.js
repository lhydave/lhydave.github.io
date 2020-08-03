// class of HTML manager, no animation involved
function HTMLManager(board, bounce_balls) {
    this.board_container = document.querySelector('.board-container');
    this.ball_counter_ele = document.querySelector('.ball-counter p');
    this.now_score_ele = document.querySelector('.now-score');
    this.bounce_balls_container = document.querySelector('.bounce-balls-container');
    this.message_container = document.querySelector('.game-message');
    this.score = 0;
    this.board = board;
    this.bounce_balls = bounce_balls;
    this.block_size = this.board.block_size; // in pixels
}

//////////////////////////////// Score elements //////////////////////////////////
// update score
HTMLManager.prototype.UpdateScore = function (new_score) {
    if (this.now_score_ele.firstChild)
        this.now_score_ele.removeChild(this.now_score_ele.firstChild);
    var diff = new_score - this.score;
    this.score = new_score;
    this.now_score_ele.textContent = this.score;
    // add some animation
    if (diff > 0) {
        var add_score = document.createElement('div');
        add_score.classList.add('add-score');
        add_score.textContent = '+' + diff;
        this.now_score_ele.appendChild(add_score);
    }
}

//////////////////////// ball bounter element //////////////////////////////////
// update now number of bounce balls
HTMLManager.prototype.UpdateBallNum = function (new_ball_num) {
    this.ball_counter_ele.textContent = ' × ' + new_ball_num.toString();
}

//////////////////////// Game Message //////////////////////////////////////////
// show the lose window
HTMLManager.prototype.ShowLose = function () {
    this.message_container.classList.add('game-over');
}

// clean the message
HTMLManager.prototype.ClearMessage = function () {
    this.message_container.classList.remove('game-over');
}

////////////////////////////// Board Elements //////////////////////////////////

// creat a new element in the board
HTMLManager.prototype.new_element = function (position) {
    var new_ele = document.createElement('div');
    new_ele.id = position.row.toString() + '-' + position.col.toString();
    this.board_container.appendChild(new_ele);
    new_ele.style.top = (this.block_size * (position.row - 1)) + 'px';
    new_ele.style.left = (this.block_size * position.col) + 'px';
    new_ele.style.zIndex = '200';
    return new_ele;
}

// delete a block
HTMLManager.prototype.delete_block = function (position) {
    var del_ele = document.getElementById(position.row + '-' + position.col);
    this.board_container.removeChild(del_ele);
}

// create a new block
HTMLManager.prototype.new_block = function (block, position) {
    var new_block = this.new_element(position);
    new_block.classList.add('block');
    new_block.classList.add('block-' + block.type);
    new_block.textContent = block.value;
    return new_block;
}
HTMLManager.prototype.hit_block = function (position) {
    var block = document.getElementById(position.row + '-' + position.col);
    var new_val = parseInt(block.textContent) - 1;
    if (new_val == 0)
        this.board_container.removeChild(block);
    block.textContent = new_val;

}

HTMLManager.prototype.hit_bonus = function (position) {
    var ball = document.getElementById(position.row + '-' + position.col);
    this.board_container.removeChild(ball);
}
// create a new bonus ball
HTMLManager.prototype.new_bonus_ball = function (position) {
    var new_bonus_ball = this.new_element(position);
    new_bonus_ball.classList.add('bonus-ball');
    new_bonus_ball.textContent = "+1";
    return new_bonus_ball;
}

// move down single element
HTMLManager.prototype.move_single = function (element) {
    var temp = element.id.split('-');
    var pos_row = Number(temp[0]);
    element.id = (pos_row + 1).toString() + '-' + temp[1];
    element.style.top = (this.block_size * pos_row).toString() + 'px';
    element.style.zIndex = parseInt(element.style.zIndex) + 1;
}
// move down, suppose board is the movable and has been moved.
HTMLManager.prototype.move_all = function () {
    var self = this;
    var eles = this.board_container.childNodes;
    eles.forEach(function (val) { self.move_single(val); });
}

// for frame move
HTMLManager.prototype.move_single_frame = function (element, step) {
    var new_top = Number(element.style.top.split('px')[0]) + step;
    element.style.top = new_top + 'px';
}

HTMLManager.prototype.move_all_frame = function (step) {
    var self = this;
    var eles = this.board_container.childNodes;
    eles.forEach(function (val) { self.move_single_frame(val, step); });
}

// create new block row, suppose row was already created in the board
HTMLManager.prototype.new_row = function () {
    for (var i = 0; i < this.board.width; i++) {
        var ele = this.board.contents[0][i];
        if (ele) {
            if (ele.constructor == Block)
                this.new_block(ele, { row: 0, col: i });
            else
                this.new_bonus_ball({ row: 0, col: i });
        }
    }
}

// clean the original board and create a new board from board
HTMLManager.prototype.new_board = function () {
    while (this.board_container.firstChild)
        this.board_container.removeChild(this.board_container.firstChild);
    for (var i = 0; i < this.board.height; i++)
        for (var j = 0; j < this.board.width; j++) {
            var ele = this.board.contents[i][j];
            if (ele) {
                if (ele.constructor == Block)
                    this.new_block(ele, { row: i, col: j });
                else
                    this.new_bonus_ball({ row: i, col: j });
            }
        }
}

//////////////////////// BounceBall Elements //////////////////////////////////

// create a new bounce ball
HTMLManager.prototype.new_bounce_ball = function (ball, idx) {
    var ball_ele = document.createElement('div');
    ball_ele.classList.add('bounce-ball');
    ball_ele.id = 'ball-' + idx;
    ball_ele.style.top = ball.top + 'px';
    ball_ele.style.left = ball.left + 'px';
    this.bounce_balls_container.appendChild(ball_ele);
}
// clean the original bounce ball container and create a new bounce ball list
HTMLManager.prototype.new_bounce_balls = function () {
    while (this.bounce_balls_container.firstChild)
        this.bounce_balls_container.removeChild(this.bounce_balls_container.firstChild);
    var ball_num = this.bounce_balls.length;
    for (var i = 0; i < ball_num; i++)
        this.new_bounce_ball(this.bounce_balls[i], i);
}

// move single ball
HTMLManager.prototype.move_single_ball = function (ball_ele) {
    var idx = parseInt(ball_ele.id.split('-')[1]);
    var ball = this.bounce_balls[idx];
    ball_ele.style.top = ball.top + 'px';
    ball_ele.style.left = ball.left + 'px';
}

// move all balls
HTMLManager.prototype.move_all_balls = function () {
    var ball_eles = this.bounce_balls_container.childNodes;
    var self = this;
    ball_eles.forEach(function (ball) { self.move_single_ball(ball) });
}

/////////////////////////////// Game State ////////////////////////////////////////
// clean all things
HTMLManager.prototype.clear = function (ball_num, score) {
    this.ClearMessage();
    this.UpdateScore(score);
    this.UpdateBallNum(ball_num);
    this.new_bounce_balls();
    this.new_board();
}