var bookmarks = [];
var bookmarksSort = {};

window.onload = function() {
    if (!bookmarks.length) start();

    document.getElementById('sort').onclick = update;
}

function ucFirst(str) {
    if (!str) return str;

    return str[0].toUpperCase() + str.slice(1);
}

function start() {
    // Берём дерево закладок
    chrome.bookmarks.getTree(function(Tree) {
        // И проходимся рекурсивно
        function parseChildren(x) {

            x.forEach(function(element, index) {
                if (element.children instanceof Array) {
                    parseChildren(element.children);
                } else {
                    //  Если это закладка, добавить
                    bookmarks.push(element);
                };

            });

        }
        // Начиная с главного
        parseChildren(Tree);
        sort();
    });
}

function sort() {
    bookmarks.forEach(function(element, index) {
        var site = purl(element.url).attr("host");

        if (bookmarksSort[site] == undefined) {
            bookmarksSort[site] = [element];
        } else {
            bookmarksSort[site].push(element);
        }
    });

    view();
}

function view() {
    var view = document.getElementById('view');

    for (var p in bookmarksSort) {

        var list = bookmarksSort[p],
            url = purl(list[0].url),
            host = url.attr('host'),
            name = (p.substring(0, 4) === "www.") ? p.substring(4) : p,
            href = url.attr('protocol') + '://' + host;

        var tr = document.createElement('tr');

        tr.innerHTML = '<td>' +
            '<a href="' + href + '" target="_blank">' + ucFirst(name) + '</a>' +
            '</td>' +
            ' <td>' + list.length + '</td>';
        view.appendChild(tr);
    }

    $('table').DataTable({
        "language": {
            "info": "Показано _START_ из _END_. Всего _TOTAL_ сайтов.",
            "infoEmpty": "Показывать 0 to 0 of 0 entries",
            "lengthMenu": "Показывать _MENU_ записей",
            "search": "Поиск:",
            "paginate": {
                "first": 'Начало',
                "last": "Назад",
                "next": "Следующий",
                "previous": "Вперёд"
            },
        }

    });

}


function update() {
    $("#sort").addClass("loading");
    remove();
}


function remove() {
    // Берём дерево закладок
    chrome.bookmarks.getTree(function(Tree) {
        // И проходимся рекурсивно
        function parseChildren(x) {

            x.forEach(function(element, index) {
                if (element.children instanceof Array) {
                    parseChildren(element.children);
                    // Если это не root каталог
                    if (element.parentId != 0 && element.id != 1 && element.id != 0) {
                        chrome.bookmarks.removeTree(element.id)
                    }

                } else {
                    chrome.bookmarks.remove(element.id)
                };

            });

        }
        // Начиная с главного
        parseChildren(Tree);
        //  Создание папок и вкладок
        crate();
    });
}

function crate() {
    for (var p in bookmarksSort) {

        var list = bookmarksSort[p],
            url = purl(list[0].url),
            host = url.attr('host'),
            name = (p.substring(0, 4) === "www.") ? p.substring(4) : p,
            href = url.attr('protocol') + '://' + host;

        function createookmark(P) {
            return function(dir) {
                bookmarksSort[P].forEach(function(element, index) {
                    chrome.bookmarks.create({
                        parentId: dir.id,
                        title: element.title,
                        url: element.url
                    });
                });
            };
        };
        // Что бы сохранить p иначе будет только последний элемент
        chrome.bookmarks.create({
            parentId: '1',
            title: ucFirst(name) + " (" + list.length + ")"
        }, createookmark(p));
    };

    $("#sort").text("Готово");
    $("#sort").removeClass('loading');
    $("#sort").addClass("positive");
};
