import os
from glob import glob
import subprocess

blog_location = "assets/blog"
output_location = "blogPages"
cmd = "pandoc --standalone -f markdown {0}/{2}.md -t html -o {1}/{2}.html --template=assets/templates/pandoc_blog_template.html -V document-css --listing"

files = glob("{0}/*.md".format(blog_location))

names = [os.path.splitext(os.path.basename(x))[0] for x in files]

created = []

for x in names:
    execute_cmd = cmd.format(blog_location, output_location, x)
    proc = subprocess.Popen(execute_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Parsing '{0}/{1}.md'".format(blog_location, x))
    print("=" * 80)
    print(proc.stdout.read().decode("ascii"))
    print("-" * 80)
    print(proc.stderr.read().decode("ascii"))
    print("=" * 80)

    created.append("{0}/{1}.html".format(output_location, x))

print("")
print("Created Files: ")
print("=" * 80)
for x in created:
    print("    '{0}'".format(x))
