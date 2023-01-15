# TreeSearchTS
## Description
is a seample program developed in typescript to make a tree of a site based on his html links or search some query in the site when is doing that tree search.
## Startup
First create a folder named out, install required dependences with "npm install" and then compile the project with tsc.
## Example
Tree example:

node out/index.js -u https://idk.com/

Search tree example:

node out/index.js -u https://idk.com/ -q "hello"

Set headers with -h:

node out/index.js -u https://idk.com/ -h "Cookies: abcde" -h "Some-other-header: value"
