// class of board
function Board(width, height, block_size, bonus_radius) {
    this.width = width; // how many blocks per row
    this.height = height + 1; // how many blocks per column
    this.block_size = block_size; // size of each block
    this.bonus_radius = bonus_radius; // radius of each bonus ball
    // arrange blocks and bonus balls
    this.contents = this.empty();
}

// create an empty board
Board.prototype.empty = function () {
    blocks = [];
    for (var i = 0; i < this.height; i++) {
        var row = blocks[i] = [];
        for (var j = 0; j < this.width; j++) {
            row.push(null);
        }
    }
    return blocks;
}

// check if the position in the board
Board.prototype.InBoard = function (position) {
    return position.row >= 1 && position.row < this.height &&
        position.col >= 0 && position.col < this.width;
}

// output the elementType
Board.prototype.Element = function (position) {
    return this.contents[position.row][position.col];
}
// delete content
Board.prototype.delete_content = function (position) {
    if (this.contents[position.row][position.col])
        delete this.contents[position.row][position.col];
    this.contents[position.row][position.col] = null;
}

// clean the board
Board.prototype.clear = function () {
    for (var i = 0; i < this.height; i++)
        for (var j = 0; j < this.width; j++)
            this.delete_content({ row: i, col: j });
}
// return the margin of the block
Board.prototype.block_margin = function (position) {
    return {
        top: (position.row - 1) * this.block_size,
        bottom: position.row * this.block_size,
        left: position.col * this.block_size,
        right: (position.col + 1) * this.block_size
    };
}

// return the position of the point
Board.prototype.point_position = function (point) {
    return {
        row: Math.ceil(point.top / this.block_size),
        col: Math.floor(point.left / this.block_size)
    };
}

// hit a block
Board.prototype.hit_block = function (position) {
    var block = this.Element(position);
    console.assert(block && block.constructor == Block, 'Element is not a Block');
    block.value -= 1;
    if (block.value == 0) this.delete_content(position);
}

// hit a bonus ball
Board.prototype.hit_bonus_ball = function (position) {
    var ball = this.Element(position);
    console.assert(ball && ball.constructor == BonusBall, 'Element is not a Bonusball');
    this.delete_content(position);
}

// move down the block
Board.prototype.movedown = function () {
    for (var i = this.height - 2; i >= 0; i--)
        for (var j = 0; j < this.width; j++) {
            this.contents[i + 1][j] = this.contents[i][j];
        }
}

// judge whether the blocks dash against the buttom
Board.prototype.is_broken = function () {
    return this.contents[this.height - 1].some(function (val) {
        return val && val.constructor == Block;
    })
}

// generate a random row
Board.prototype.rand_row = function (level) {
    row = [];
    if (level < 300)
        row.push(new BonusBall());
    types = [];
    empty_prob = 0.3;
    block_prob = [0.44, 0.89, 0.99, 1.0];
    if (level < 5)
        types = ['2', '5', '5', '10'];
    else if (level < 10)
        types = ['5', '10', '10', '20'];
    else if (level < 20)
        types = ['10', '20', '30', '50'];
    else if (level < 30)
        types = ['20', '30', '50', '70'];
    else if (level < 50)
        types = ['30', '50', '70', '100']
    else if (level < 80)
        types = ['50', '70', '100', '30'];
    else
        types = ['70', '100', '100', '2'];
    type_num = types.length;
    while (this.width > row.length) {
        p = Math.random();
        if (p > empty_prob)
            row.push(null);
        else {
            p = Math.random();
            for (var j = 0; j < type_num; j++)
                if (p <= block_prob[j]) {
                    row.push(new Block(Number(types[j]), types[j]));
                    break;
                }
        }
    }
    row.sort(function (a, b) { return 0.5 - Math.random(); });
    return row;
}

// create a new row and move down
Board.prototype.next_level = function (level) {
    delete this.contents[0];
    this.contents[0] = this.rand_row(level + 1);
    this.movedown();
}
