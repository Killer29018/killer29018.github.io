document.addEventListener('readystatechange', event => {
    if (event.target.readyState == "interactive") {
        fetch('./assets/json/projects.json')
            .then((response) => response.json())
            .then((json) => { populateProjects(json); moveToHash(); });
        fetch('./assets/json/blogList.json')
            .then((response) => response.json())
            .then((json) => { populateBlogs(json); });
    }
})

function moveToHash() {
    let urlHash = window.location.hash;

    if (urlHash) {
        item = document.getElementById(urlHash.substring(1));
        setTimeout(function() { item.scrollIntoView(true); console.log("Loaded"); }, 300);
    }
}

function redirect(url) {
    window.open(url, "mywindow");
}

function populateBlogs(json) {
    var blogsDoc = document.getElementById("blog_list");
    console.log(blogsDoc);
    blogs = json['blogs'];

    var outerTable = document.createElement("div");
    outerTable.setAttribute("id", "outerBlogTable")

    var table = document.createElement("table");
    table.setAttribute("id", "blogTable");

    for (var i = 0; i < blogs.length; i++) {
        blog = blogs[i];

        var entry = document.createElement("tr");
        entry.setAttribute("id", blog["md"])
        entry.addEventListener("click", function() { gotoBlog(this) })

        var date = document.createElement("td");
        date.innerText = `${blog["date"]}`;
        date.setAttribute("class", "blogListDate");

        var name = document.createElement("td");
        name.innerText = `${blog["name"]}`;
        name.setAttribute("class", "blogListName");

        var divider = document.createElement("div");
        divider.innerText = "|";
        divider.setAttribute("class", "blogListDivider");

        entry.appendChild(date)
        entry.appendChild(divider)
        entry.appendChild(name)

        table.appendChild(entry)

    }

    outerTable.appendChild(table);
    blogsDoc.appendChild(outerTable);
}

function gotoBlog(item) {
    var name = item.getAttribute("id")

    localStorage.setItem("blogName", name);
    console.log(`Written ${name}`);

    window.location.href = "blog.html";
}

function populateProjects(json) {
    var activeProjectsDoc = document.getElementById("projects_active");
    activeProjects = json["activeProjects"];
    for (var i = 0; i < activeProjects.length; i++) {
        addProject(activeProjects[i], activeProjectsDoc, true);
    }

    var previousProjectsDoc = document.getElementById("projects_previous");
    previousProjects = json["previousProjects"];
    for (var i = 0; i < previousProjects.length; i++) {
        addProject(previousProjects[i], previousProjectsDoc, false);
    }

    console.log("Loaded projects");
}

function addProject(project, doc, isActive) {
    var activeString = isActive ? "active" : "previous";

    var outerDiv = document.createElement("div");
    outerDiv.setAttribute("class", `Project_${activeString}_outer Project_outer`)

    var div = document.createElement("div");
    div.setAttribute("class", `Project_${activeString}_inner Project_inner`);
    if (project['link'] != "") {
        div.setAttribute("onclick", `redirect('${project['link']}')`);
    }

    var name = document.createElement("div");
    name.setAttribute("class", `Project_${activeString}_name Project_name`);
    name.innerText = project["name"];
    div.appendChild(name);

    if (project['img'] != "") {
        var image = document.createElement("img");
        image.setAttribute("src", `${project['img']}`);

        var surroundingDiv = document.createElement("div");
        surroundingDiv.setAttribute("class", `Project_${activeString}_img Project_img`);
        surroundingDiv.appendChild(image);

        div.appendChild(surroundingDiv);
    }

    var desc = document.createElement("div");
    desc.setAttribute("class", `Project_${activeString}_desc Project_desc`);
    desc.innerText = project["description"];
    div.appendChild(desc);

    outerDiv.appendChild(div);

    doc.appendChild(outerDiv);
}
