document.addEventListener('readystatechange', event => {
    if (event.target.readyState == "interactive") {
        fetch('./assets/json/projects.json')
            .then((response) => response.json())
            .then((json) => populateProjects(json));
    }
})

function redirect(url)
{
    window.open(url, "mywindow");
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