export function checkReadScope(req, res, next) {
    if(req.authInfo.checkLocalScope("read")) {
        return next();
    } else {
        console.log("Missing read authorization");
        res.status(403).end("Missing read authorization");
    }
}

export function checkPerformScope(req, res, next) {
    if(req.authInfo.checkLocalScope("perform")) {
        return next();
    } else {
        console.log("Missing perform authorization");
        res.status(403).end("Missing perform authorization");
    }
}