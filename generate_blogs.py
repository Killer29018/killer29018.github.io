import os
from glob import glob
import subprocess
import json

blog_location = "assets/blog"
output_location = "blogPages"
blog_json_location = "assets/json/blogList.json"
generate_html_cmd = "pandoc --standalone -f markdown {0}/{2}.md -t html -o {1}/{2}.html --mathml --template=assets/templates/pandoc_blog_template.html -V document-css"
json_cmd = "pandoc -f markdown {0}/{1}.md -t json"

files = glob("{0}/*.md".format(blog_location))

names = [os.path.splitext(os.path.basename(x))[0] for x in files]

created = []

output_json = {"blogs": []}

def parse_MetaInlines(inline):
    if not inline["t"] == "MetaInlines":
        raise AttributeError(f"Expected MetaInlines got {inline['t']}")

    content = inline["c"]
    string = ""
    for x in content:
        t = x["t"]
        if t == "Str":
            string += x["c"]
        elif t == 'Space':
            string += " "
        else:
            raise TypeArgument(f"Unexpected type {t}")

    return string

def parse_MetaBool(inline):
    if not inline["t"] == "MetaBool":
        raise AttributeError(f"Expected MetaBool got {inline['t']}")

    content = inline["c"]
    return content

def parse_meta(meta):
    global output_json

    title = ""
    date = ""
    author = ""

    try:
        complete_json = meta["complete"]
        complete = parse_MetaBool(complete_json)
        if not complete:
            print("Not including")
            return
        else:
            print("Included")
    except AttributeError:
        print("Invalid type")
        raise
    except KeyError:
        print("Not including")
        return
    except:
        raise

    try:
        title_json = meta["title"]
        title = parse_MetaInlines(title_json)
    except AttributeError:
        print("Invalid type")
        raise
    except KeyError:
        print("Could not find key 'title'")
        return
    except:
        raise

    try:
        author_json = meta["author"]
        author = parse_MetaInlines(author_json)
    except AttributeError:
        print("Invalid type")
        raise
    except KeyError:
        print("Could not find key 'author'")
        return
    except:
        raise

    try:
        date_json = meta["date"]
        date = parse_MetaInlines(date_json)
    except AttributeError:
        print("Invalid type")
        raise
    except KeyError:
        print("Could not find key 'date'")
        return
    except:
        raise

    entry = {
        "title": title,
        "author": author,
        "date": date
    }
    output_json["blogs"].append(entry)

for x in names:
    execute_cmd = generate_html_cmd.format(blog_location, output_location, x)
    proc = subprocess.Popen(execute_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Parsing '{0}/{1}.md'".format(blog_location, x))
    print("=" * 80)
    print(proc.stdout.read().decode("UTF-8"))
    print("-" * 80)
    print(proc.stderr.read().decode("UTF-8"))
    print("=" * 80)

    created.append("{0}/{1}.html".format(output_location, x))

    execute_cmd = json_cmd.format(blog_location, x)
    proc = subprocess.Popen(execute_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    js = json.loads(proc.stdout.read().decode("UTF-8"))

    meta = js["meta"]

    parse_meta(meta)
    print()

print("")
print("Created Files: ")
print("=" * 80)
for x in created:
    print("    '{0}'".format(x))

output_json["blogs"].sort(key=lambda x: x["date"], reverse=True)
output_json_str = json.dumps(output_json, indent = 4, sort_keys = True)
with open(blog_json_location, "w") as file:
    file.write(output_json_str)
