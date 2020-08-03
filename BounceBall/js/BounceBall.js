// class BounceBall
function BounceBall(radius, location, velocity) {
    this.left = location.left;
    this.top = location.top;
    this.v_left = velocity.left;
    this.v_top = velocity.top;
    this.radius = radius;
}

// set the movement parameters of the ball
BounceBall.prototype.setV = function (velocity) {
    this.v_left = velocity.left;
    this.v_top = velocity.top;
}

// simple displacement
BounceBall.prototype.displace = function (location) {
    var new_v = Math.sqrt((this.left - location.left) * (this.left - location.left) +
        (this.top - location.top) * (this.top - location.top));
    if (new_v < 1.0) return;
    this.v_left = (location.left - this.left) / new_v;
    this.v_top = (location.top - this.top) / new_v;
    this.left += this.v_left;
    this.top += this.v_top;
}

// when the ball reachs the bottom, retrieve it
BounceBall.prototype.IsBottom = function (board) {
    var topBrim = {
        top: this.top,
        left: this.left + this.radius
    };
    return board.point_position(topBrim).row == board.contents.length - 1 &&
        this.v_top > 0;
}

// whether the trace crosses the bonus ball
BounceBall.prototype.cross_bonus = function (board) {
    var ball_c = {
        left: this.left + this.radius,
        top: this.top + this.radius
    };
    var ball_loc = board.point_position(ball_c);
    if (!board.Element(ball_loc) || board.Element(ball_loc).constructor != BonusBall)
        return null;
    var bonus_c = {
        left: board.block_margin(ball_loc).left + board.block_size / 2,
        top: board.block_margin(ball_loc).top + board.block_size / 2,
    };
    var dist = Math.sqrt((ball_c.left - bonus_c.left) * (bonus_c.left - bonus_c.left) +
        (ball_c.top - bonus_c.top) * (ball_c.top - bonus_c.top));
    if (dist <= this.radius + board.bonus_radius)
        return ball_loc;
    return null;
}

// calculate the single block collision, return new velocity
BounceBall.prototype.block_collision = function (board, position) {
    // there is no block
    if (board.InBoard(position) &&
        (!board.Element(position) || board.Element(position).constructor != Block))
        return null;
    var margins = board.block_margin(position);
    // corner points
    var corners = [
        [margins.left, margins.top], [margins.right, margins.top],
        [margins.left, margins.bottom], [margins.right, margins.bottom]];
    var ball_c = {
        left: this.left + this.radius,
        top: this.top + this.radius
    }
    var new_v = { left: this.v_left, top: this.v_top };

    // possible hit point
    var vert_point = {
        left: this.left + this.radius,
        top: this.top + (this.v_top > 0 ? this.radius * 2 : 0)
    };
    var vert_loc = board.point_position(vert_point);
    var horiz_point = {
        left: this.left + (this.v_left > 0 ? this.radius * 2 : 0),
        top: this.top + this.radius
    };
    var horiz_loc = board.point_position(horiz_point);

    var change = false;
    // hit the edge
    // horizontal edge
    if (horiz_loc.col == position.col && horiz_loc.row == position.row) {
        change = true;
        new_v.left = -new_v.left;
    }
    // perpendicular edge
    if (vert_loc.col == position.col && vert_loc.row == position.row) {
        change = true;
        new_v.top = -new_v.top;
    }
    // hit the corner??
    if (!change) {
        for (var i = 0; i < 4; i++)
            if (Math.sqrt((ball_c.left - corners[i][0]) * (ball_c.left - corners[i][0]) +
                (ball_c.top - corners[i][1]) * (ball_c.top - corners[i][1])) <=
                this.radius) {
                new_v.left = -new_v.left;
                new_v.top = -new_v.top;
                change = true;
                break;
            }
    }
    if (change)
        return new_v;
    return null;
}

// calculate all the block collision
BounceBall.prototype.all_collision = function (board) {
    var ball_c = {
        left: this.left + this.radius,
        top: this.top + this.radius
    }
    var ball_loc = board.point_position(ball_c);

    // blocks possible be collided
    var possi_dir = [];
    // stationary is not a collision
    if (this.v_left == 0 && this.v_top == 0)
        return null;
    if (this.v_top > 0 && this.v_left > 0)
        possi_dir = [[1, 0], [1, 1], [0, 1]];
    else if (this.v_top > 0 && this.v_left < 0)
        possi_dir = [[-1, 0], [-1, 1], [0, 1]];
    else if (this.v_top < 0 && this.v_left > 0)
        possi_dir = [[0, -1], [1, -1], [1, 0]];
    else
        possi_dir = [[-1, 0], [-1, -1], [0, -1]];
    var possi_blocks = [];
    for (var i = 0; i < 3; i++) {
        var temp_blk = {
            col: possi_dir[i][0] + ball_loc.col,
            row: possi_dir[i][1] + ball_loc.row
        };
        var new_v = this.block_collision(board, temp_blk);
        if (new_v)
            possi_blocks.push({
                new_v: new_v,
                block: temp_blk
            });
    }
    var possi_num = possi_blocks.length;
    // no collision
    if (possi_num == 0) return null;
    // exactly one collision
    if (possi_num == 1) return possi_blocks[0];
    // two collisions?
    if (possi_num == 2) {
        // a resonable collision
        if (possi_blocks[0].new_v.left == -this.v_left &&
            possi_blocks[0].new_v.top == -this.v_top)
            return possi_blocks[1];
        if (possi_blocks[1].new_v.left == -this.v_left &&
            possi_blocks[1].new_v.top == -this.v_top)
            return possi_blocks[0];
        return {
            new_v: { left: -this.v_left, top: -this.v_top },
            block: possi_blocks[0]
        };
    }
    // three collisions???
    return {
        new_v: { left: -this.v_left, top: -this.v_top },
        block: possi_blocks[0]
    };
}

// Make one step move 
BounceBall.prototype.step_move = function (board) {
    var hit_blocks = this.all_collision(board);
    // no hit
    if (!hit_blocks) {
        this.top += this.v_top;
        this.left += this.v_left;
        var bonus = this.cross_bonus(board);
        return {
            block: null,
            bonus: bonus
        };
    }
    this.v_left = hit_blocks.new_v.left;
    this.v_top = hit_blocks.new_v.top;
    // hit the block
    if (board.InBoard(hit_blocks.block))
        return {
            block: hit_blocks.block,
            bonus: null
        };
    // hit the border
    return {
        block: null,
        bonus: null
    }
}