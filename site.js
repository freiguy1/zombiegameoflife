
function ViewModel() {
    var self = this;
    self.grid = ko.observableArray([]);
    self.zombdawgs = ko.observable(false);

    self.zombdawgs.subscribe(function(newValue) {
        if (!newValue) {
            _.each(self.grid(), function(row, x) {
                _.each(row(), function(cell, y) {
                    if (cell.isZombie()) {
                        cell.isZombie(false);
                        cell.isAlive(true);
                    }
                });
            });
        }
    });

    for (var i = 0; i < 30; i++) {
        var row = ko.observableArray([]);
        for (var j = 0; j < 30; j++) {
            var isAlive = getRandomBool();
            row.push(new Cell(isAlive, 0, false));
        }
        self.grid.push(row);
    }
}

function getRandomBool() {
    return Boolean(Math.round(Math.random()));
}

function Cell(isAlive, age, isZombie) {
    var self = this;
    self.isAlive = ko.observable(isAlive);
    self.age = ko.observable(age);
    self.isZombie = ko.observable(isZombie);
}

function loop() {
    var newGrid = ko.observableArray([]);
    _.each(viewModel.grid(), function(row, x) {
        var newRow = ko.observableArray([]);
        _.each(row(), function(cell, y) {
            var state = getAliveNeighbors(viewModel.grid, x, y);
            newRow.push(calculateNextTickCell(cell, state.count, state.nextToZombie));
        });
        newGrid.push(newRow);
    });
    viewModel.grid(newGrid());
}

function calculateNextTickCell(oldCell, aliveNeighbors, nextToZombie) {
    if (viewModel.zombdawgs() && oldCell.isZombie()) {
        return new Cell(false, oldCell.age() + 1, true);
    } else if (viewModel.zombdawgs() && nextToZombie && oldCell.isAlive()) { // Next to zombie becomes zombie
        return new Cell(false, oldCell.age() + 1, true);
    } else if (viewModel.zombdawgs() && oldCell.isAlive() && oldCell.age() >= 3) { // Old person turns into zombie
        return new Cell(false, oldCell.age() + 1, true);
    } else if (oldCell.isAlive() && aliveNeighbors < 2) { // Rule 1
        return new Cell(false, 0, false);
    } else if (oldCell.isAlive() && aliveNeighbors > 3) { // Rule 3
        return new Cell(false, 0, false);
    } else if (!oldCell.isAlive() && aliveNeighbors == 3)  { // Rule 4
        return new Cell(true, 0, false);
    } else if (oldCell.isAlive()) { // Increment age on alive cells
        return new Cell(oldCell.isAlive(), oldCell.age() + 1, oldCell.isZombie());
    } else { // Dead cells stay dead
        return new Cell(oldCell.isAlive(), 0, oldCell.isZombie());
    }
}

function getAliveNeighbors(grid, x, y) {
    var xs = [x - 1, x, x + 1];
    var ys = [y - 1, y, y + 1];
    xs = _.filter(xs, function(thing) { return thing >= 0 && thing < grid().length });
    ys = _.filter(ys, function(thing) { return thing >= 0 && thing < grid().length });
    var count = 0;
    var nextToZombie = false;
    _.each(xs, function(x2) {
        _.each(ys, function(y2) {
            if (x2 != x || y2 != y) {
                var cell = grid()[x2]()[y2];
                if (cell.isAlive()) { count ++; }
                if (cell.isZombie()) { nextToZombie = true; }
            }
        });
    });
    return { count: count, nextToZombie: nextToZombie };
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);
setInterval(loop, 400);
