import { CONFIG, Option, throwError } from "./lib/config.js";
import Tree from "./lib/tree.js";

const URL : string = <string> CONFIG.url;
const query : string | undefined = <string | undefined> CONFIG.query;
const TREE : Tree = new Tree(URL);

TREE.setHeaders(<object> CONFIG.headers);

TREE.on("error", (err : string) => throwError(err));

if(query){
    
    TREE.search(<string> query);

    TREE.on("found", (url : string, index : number) => {
    
        console.log("Found on " + url + " in " + index);
    
    });

}else {

    TREE.tree();

    TREE.on("done", (url : string, value : string, content : string) => {

        console.log(url);

    });

};