import Url, { UrlStruct } from "./url.js";
import { EventEmitter } from "events";
import * as https from 'https';
import * as http from 'http';

interface RequestOptions {
    host : string;
    port : number | undefined;
    path : string | undefined;
    query : string | undefined;
    method : string;
    headers : object | undefined;
};

export default class Tree extends EventEmitter {

    private url : Url;
    private hosts : string[] = [];
    private urls : string[] = [];
    private queue : string[] = [];
    private done : string[] = [];
    private headers : object = {}; 

    private throwError(err : string) : void {

        this.emit("error", err);

    };

    public constructor(url : string) {

        super();
        this.url = new Url(url);
        this.url.digest();
        if(!this.url.isValid()) this.throwError("Invalid initial url!");

    };

    public check(queue : string[], extract : string[]) : string [] {

        //console.log(queue.length);
        let checked : string[] = Array.from(queue);
        
        for(let url of extract){

            let isSameHost : boolean = this.url.compareHost(url);

            if(isSameHost){
            
                if(queue.indexOf(url) == -1)
                    checked.push(url);
                else continue;
            
            }else {

                let host : string | void = this.url.getHost(url);
                if(!host) continue;

                if(this.hosts.indexOf(host) === -1) this.hosts.push(host);
                else continue;

            };

        };

        return checked;

    };

    private setCookie(cookies : string, newCookies : string) : string {

        let sCookies : string[] = cookies.split(";");
        let objCookies : object = {};

        for(let i = 0; i < sCookies.length; i++){

            let sCookie : string[] = sCookies[i].split("=");
            let key : string = sCookie[0].toLowerCase().trim();
            let value : string | undefined = (sCookie.length > 1) ? sCookie[1] : undefined;
            
            objCookies[key] = value;

        };

        sCookies = newCookies.split(";");

        for(let i = 0; i < sCookies.length; i++){

            let sCookie : string[] = sCookies[i].split("=");
            let key : string = sCookie[0].toLowerCase().trim();
            let value : string | undefined = (sCookie.length > 1) ? sCookie[1] : undefined;
            console.log(key + " --> " + value);
            objCookies[key] = value;

        };

        cookies = "";
        let objCookiesKeys : string[] = Object.keys(objCookies);

        for(let i = 0; i < objCookiesKeys.length; i++){

            let key : string = objCookiesKeys[i];
            let value : string | undefined = objCookies[key];
            let nCookie : string = " " + key + ((!value) ? "" : "=" + value) + ((i + 1 < objCookiesKeys.length) ? ";" : "");
            
            cookies += nCookie;

        };

        return cookies;

    };

    public async tree() : Promise<string[]> {

        let parent : any = this;

        async function request(options : object, protocol : string = "https") : Promise<string> {

            return await new Promise((resolv, reject) => {

                let data : string = "";

                let req : any = ((protocol === "http") ? http : https).request(<object> options, async (res : any) => {

                    console.log(options);

                    if(res.statusCode === 302){

                        let struct : UrlStruct = new Url(res.headers.location).digest();
                        let nOptions : object = {
                            host : <string> struct.host,
                            port : (!struct.port) ? 443 : struct.port,
                            path : (!struct.path) ? '/' : struct.path,
                            query : (!struct.query) ?  undefined : parent.url.parseQuery(struct.query),
                            method : "GET",
                            headers : (!options["headers"]) ? {} : options["headers"]
                        };

                        if(res.headers["set-cookie"]){
                            nOptions["headers"]["cookie"] = parent.setCookie(nOptions["headers"]["cookie"], res.headers["set-cookie"][0]);
                        };

                        resolv(await request(nOptions, struct.protocol)); 

                    }else {
                        
                        res.on("data", (buff : Buffer) => data += buff.toString());
                        res.on("error", (err : string)  : void => this.throwError(err));
                        res.on("end", () : void => resolv(data));
                    
                    };

                });

                req.end();

            });

        };

        let tree : string[] = [];
        let queue : string[] = [this.url.url];
        let stop : boolean = false;

        this.on("stop", () => stop = true);

        for(let i = 0; i < queue.length && !stop; i++){

            let url : string = queue[i];
        
            let struct : UrlStruct = new Url(url).digest();
            let options : RequestOptions = {
                host : <string> struct.host,
                port : (!struct.port) ? 443 : struct.port,
                path : (!struct.path) ? '/' : struct.path,
                query : (!struct.query) ?  undefined : parent.url.parseQuery(struct.query),
                method : "GET",
                headers : this.headers
            };

            let content : string = await request(options, struct.protocol);
            
            this.emit("done", url, content);
            
            let extracted : string[] = this.extract(content);
            
            queue = this.check(queue, extracted);            

        };

        return tree;

    };

    public stop() : void { this.emit("stop"); };

    public search(query : string) : void {

        this.tree();

        const regex : RegExp = new RegExp(query, "i");

        this.on("done", (url : string, content : string) : void => {

            let match : any = content.match(regex);

            while(match !== null){

                let value : string = match[0];

                this.emit("found", url, value, match.index);
                content = content.slice(match.index + value.length);
                match = content.match(regex);
            
            };

        });

    };

    public extract(content : string) : string[] {

        const URL_REGEXP : RegExp = /(src|href)=/i;

        let urls : string[] = [];
        let match : any = content.match(URL_REGEXP);

        // href, src, IA for js ?

        while(match !== null){

            let url : string = content.slice((match.index + match[0].length), content.length);
            let start : number;
            let end : number;

            switch(url[0]){

                case '"':
                    start = 1;
                    end = (url.slice(1, url.length)).indexOf('"') + 1;
                    break;
                case '\'':
                    start = 1;
                    end = (url.slice(1, url.length)).indexOf('\'') + 1;
                    break;
                default:
                    start = 0;
                    end = url.indexOf(' ');

            };

            content = url.slice(end + 1, url.length);
            url = url.slice(start, end);
            
            let check : Url = new Url(url);
            check.digest();
            if(check.isValid()) urls.push(url);

            match = content.match(URL_REGEXP);

        };

        return urls;
    };

    public setHeaders(headers : object) : void {

        Object.assign(this.headers, headers);

    };

}
