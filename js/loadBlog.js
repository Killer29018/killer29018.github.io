document.addEventListener('readystatechange', event => {
    if (event.target.readyState == "interactive") {
        loadBlog()
    }
})

function loadBlog()
{
    var blog = localStorage.getItem("blogName");

    console.log(blog)

    fetch(`./assets/blog/${blog}`)
        .then((response) => response.text())
        .then((md) => { generateHTML(md); } )
}

function generateHTML(md)
{
    var converter = new showdown.Converter();
    var html = converter.makeHtml(md);

    var blogContentDoc = document.getElementById("blog-content");

    blogContentDoc.insertAdjacentHTML('beforeend', html);
}

