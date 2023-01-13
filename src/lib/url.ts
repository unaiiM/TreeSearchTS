type UndefinedString = string | undefined; 
type UndefinedNumber = number | undefined;

export interface UrlStruct {
    protocol : UndefinedString,
    host : UndefinedString,
    port : UndefinedNumber,
    path : UndefinedString,
    query : UndefinedString
};

export default class Url {

    public url : string;
    public digested : UrlStruct = {
        protocol : undefined,
        host : undefined,
        port : undefined,
        path : undefined,
        query : undefined
    }; 

    public constructor(url : string) {

        this.url = url;

    };

    public getProtocol(url : string = this.url) : UndefinedString {

        let proto : UndefinedString;

        if(url.substring(0, "http://".length) === "http://") proto = "http";
        else if (url.substring(0, "https://".length) === "https://") proto = "https";

        return proto;

    };

    public isValidHost(host : string) : boolean {

        // abc.bca.com || 127.0.0.1

        let valid : boolean = true;
        let isIpv4 : boolean = false;

        for(let s of host.split(".")){

            if(isIpv4 && Number.isNaN(Number(s))){
            
                valid = false;
                break;
            
            }else if(!isIpv4 && !Number.isNaN(Number(s)))
                isIpv4 = true;
            else if(!isIpv4){
                
                for(let c of s){

                    if(c.match("\-|[a-z]|[0-9]")) continue;
                    else {
                        valid = false;
                        break;
                    };

                };

            }else continue;


            if(!valid) break;

        };

        return valid;

    };

    public getHost(url : string = this.url) : UndefinedString {

        let host : UndefinedString;
        let proto : UndefinedString = (!this.digested.protocol) ? this.getProtocol() : this.digested.protocol;
        let start : number;        

        if(proto === "http") start = "http://".length;
        else if(proto === "https") start = "https://".length;
        else start = 0;

        url = url.slice(start, url.length);
        
        if(url.indexOf("/") !== -1) host = url.slice(0, url.indexOf("/"));
        else host = url;

        if(host.indexOf(":") !== -1) host = host.substring(0, host.indexOf(":"));
        
        let valid : boolean = this.isValidHost(host);

        return (valid) ? host : undefined;

    };

    public getPath(url : string = this.url) : UndefinedString {

        let path : UndefinedString;
        let proto : UndefinedString = (!this.digested.protocol) ? this.getProtocol() : this.digested.protocol;
        let start : number;        

        if(proto === "http") start = "http://".length;
        else if(proto === "https") start = "https://".length;
        else start = 0;

        url = url.slice(start, url.length);

        start = url.indexOf("/");
        let index : number;

        if(start === -1) return undefined;

        path = url.slice(start, url.length);

        index = path.indexOf("?");
        if(index !== -1) path = path.slice(0, index);

        return path;

    };

    public getQuery(url : string = this.url) : UndefinedString {

        let query : UndefinedString;
        let start : number = url.indexOf("?");

        if(start !== -1) query = url.slice(start + 1, url.length);

        return query;

    };

    /*public isValidPort(port : number) : boolean {

        return (Number.isNaN(Number(port))) ? false : true;

    };*/

    public getPort(url : string = this.url) : UndefinedNumber {

        const MAX_PORT : number = 65.535;

        let port : UndefinedNumber;
        let proto : UndefinedString = (!this.digested.protocol) ? this.getProtocol() : this.digested.protocol;
        let start : number;        

        if(proto === "http") start = "http://".length;
        else if(proto === "https") start = "https://".length;
        else start = 0;

        url = url.slice(start, url.length);
        
        if(url.indexOf("/") !== -1) url = url.slice(0, url.indexOf("/"));

        if(url.indexOf(":") !== -1){
            
            port = Number(url.substring(url.indexOf(":") + 1, url.length));

            return (Number.isNaN(port) || port > MAX_PORT ) ? NaN : port;

        } else return undefined;

    };

    public digest() : UrlStruct {

        this.digested.protocol = this.getProtocol();
        this.digested.host = this.getHost();
        this.digested.port = this.getPort();
        this.digested.path = this.getPath();
        this.digested.query = this.getQuery();

        return this.digested;
    }

    public isValid() : boolean {

        return (!this.digested.host || Number.isNaN(this.digested.port)) ? false : true;

    };

    public parseQuery(query : string) : object {

        let obj : object = {};

        for(let s of query.split("&")){

            let ss : string[] = s.split("=");
            let key : string = ss[0];
            let value : string | undefined = ss[1];

            obj[key] = value;

        };

        return obj;

    };

    public setNew(url : string) : void { this.url = url };

    public compareHost(url : string) : boolean {

        let host : UndefinedString = this.getHost(url);
        
        return (host === this.digested.host) ? true : false; 

    };

}