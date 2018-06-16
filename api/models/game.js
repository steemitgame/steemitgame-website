'use strict';

import db from '../lib/db'
import redis from '../lib/redis';

exports.addGame = async function(game) {
    let rows = await db.execute(db.WRITE, 'INSERT INTO games SET ?', game);
    this.clearCache();
    return rows;
}

exports.deleteGame = async function(params) {
    let rows = await db.execute(db.WRITE, 'update games set status = 3 where id= ? and userid= ?', params);
    this.clearCache();
    return rows;
}

exports.updateGameSelf = async function(params) {
    let rows = await db.execute(db.WRITE, 'update games set ? where id= ? and userid= ?', params);
    this.clearCache();
    return rows;
}

exports.updateGame = async function(params) {
    let rows = await db.execute(db.WRITE, 'update games set ? where id= ?', params);
    this.clearCache();
    return rows;
}

exports.updateActivityCount = async function(params) {
    let rows = await db.execute(db.WRITE, 'update games set activities=activities+1 where id= ? and userid= ?', params);
    this.clearCache();
    return rows;
}

exports.auditGame = async function(params, status) {
    let rows = await db.execute(db.WRITE, 'INSERT INTO comments SET ?', params);
    rows = await db.execute(db.WRITE, 'update comments set status = 1 and type = 0 where gameid= ?', params.gameid);
    rows = await db.execute(db.WRITE, 'update games set status=?, report=0  where id= ?', [status,params.gameid]);
    this.clearCache();
    return rows;
}

exports.reportGame = async function(params) {
    let rows = await db.execute(db.WRITE, 'INSERT INTO comments SET ?', params);
    rows = await db.execute(db.WRITE, 'update games set report=1 where id= ?', params.gameid);
    this.clearCache();
    return rows;
}

exports.canReportGame = async function(params) {
    let rows = await db.execute(db.READ, 'select id from comments where gameid=? and status=0 and type=0', params);
    return rows;
}

exports.reportComments = async function(params) {
    let rows = await db.execute(db.READ, 'select id,gameid,account,permlink,userid,comment,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified from comments where gameid=? and status=0 and type=0 order by lastModified desc', params);
    return rows;
}

exports.unreportGame = async function(gameId) {
    await db.execute(db.WRITE, 'update comments set status = 1 and type = 0 where gameid= ?', gameId);
    let rows = await db.execute(db.WRITE, 'update games set report=0 where id= ?', gameId);
    this.clearCache();
    return rows;
}

exports.auditComments = async function(params) {
    let rows = await db.execute(db.READ, 'select id,gameid,account,permlink,userid,comment,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified from comments where gameid=? and status=0 and type=1 order by lastModified desc', params);
    return rows;
}

exports.getGameById = async function(gameId) {
    let rows = await db.execute(db.READ, 'select id,account,userid,title,coverImage,description,category,version,gameUrl,vote,payout,from_unixtime(created,\'%Y-%m-%dT%TZ\') as created,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified,report,status,recommend,activities,width,height from games where id=?', gameId);
    return rows;
}

exports.getActivitiesById = async function(gameId) {
    let rows = await db.execute(db.READ, 'select id,gameid,account,userid,permlink,vote,payout,status,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified from activities where gameid=?', gameId);
    return rows;
}

exports.addActivity = async function(activity) {
    let rows = await db.execute(db.WRITE, 'INSERT INTO activities SET ?', activity);
    return rows;
}

exports.getRecentlyActivity = async function(gameId) {
    let rows = await db.execute(db.READ, 'select id,gameid,account,userid,permlink,vote,payout,status,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified from activities where gameid=? order by lastModified desc limit 1', gameId);
    return rows;
}

exports.getPayoutActivities = async function() {
    let time = Math.floor(new Date() / 1000) - 86400*7;
    let rows = await db.execute(db.READ, 'select id,gameid,account,userid,permlink,vote,payout,status,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified from activities where lastModified<? and status=0  order by lastModified desc',time);
    return rows;
}

exports.countOfGames = async function(params) {
    let gameQuery = '';
    let allKey = 'game:count';
    let key = 'game:count:s:'+params['status']+':r:'+params['report']+':remm:'+params['recommend']+':a:'+params['account']+':c:'+params['category'];
    let list = await redis.instance.hgetall(allKey);
    for(let k in list ) {
        if(k == key) {
            let rows = await redis.instance.get(key);
            if(rows) {
                return JSON.parse(rows);
            }
        }
    }
    for (let k in params ) {
        if(params[k] !== '' && k !='sort' && k !='offset' && k !='pageSize') {
            gameQuery =  gameQuery + ' and ' + k + '=\'' +params[k] +'\'';
        }
    }
    let sql = 'select count(1) as nums from games where 1=1 ' + gameQuery;
    let rows = await db.execute(db.READ, sql, []);
    let count = rows[0]['nums'];
    if(count>0) {
        let data = {};
        data[key] = 1;
        await redis.instance.hmset(allKey, data);
        await redis.instance.set(key, JSON.stringify(rows));
    }
    return rows;
}

exports.gameList = async function(params) {
    let gameQuery = '';
    let allKey = 'game:list';
    let key = 'game:list:s:'+params['status']+':r:'+params['report']+':remm:'+params['recommend']+':a:'+params['account']+':c:'+params['category']+':o:'+ params['offset']+':p:'+params['pageSize']+':s:'+params['sort'];
    let list = await redis.instance.hgetall(allKey);
    for(let k in list ) {
        if(k == key) {
            let rows = await redis.instance.get(key);
            if(rows) {
                return JSON.parse(rows);
            }
        }
    }
    for (let k in params ) {
        if(params[k] !== '' && k !='sort' && k !='offset' && k !='pageSize') {
            gameQuery =  gameQuery + ' and ' + k + '=\'' +params[k] +'\'';
        }
    }
    let sortArr = params['sort'].split("_");
    let sql = 'select id,account,userid,title,coverImage,description,category,version,gameUrl,vote,payout,from_unixtime(created,\'%Y-%m-%dT%TZ\') as created,from_unixtime(lastModified,\'%Y-%m-%dT%TZ\') as lastModified,report,status,recommend,activities,width,height from games where 1=1 ' + gameQuery + ' order by ? ? limit ?,?';
    let rows = await db.execute(db.READ, sql, [sortArr[0], sortArr[1], params['offset'], params['pageSize']]);
    if(Object.keys(rows).length>0) {
        let data = {};
        data[key] = 1;
        await redis.instance.hmset(allKey, data);
        await redis.instance.set(key, JSON.stringify(rows));
    }
    return rows;
}
exports.clearCache = async function() {
    let gameListKey = 'game:list';
    let gameCountKey = 'game:count';
    let list = await redis.instance.hgetall(gameListKey);
    for(let k in list ) {
        await redis.instance.del(k);
        await redis.instance.hdel(gameListKey, k);
    }
    let countList = await redis.instance.hgetall(gameCountKey);
    for(let ck in countList ) {
        await redis.instance.del(ck);
        await redis.instance.hdel(gameCountKey,ck);
    }
}

