const express = require('express');
var cors = require('cors');
const Fuse = require('fuse.js');
const util = require('./util');
const app = express();
app.use(cors());
app.use(express.json());

app.map = (a, route) => {
  route = route || '';
  for (var key in a) {
    switch (typeof a[key]) {
      // { '/path': { ... }}
      case 'object':
        app.map(a[key], route + key);
        break;
      // get: function(){ ... }
      case 'function':
        app[key](route, a[key]);
        break;
    }
  }
};

var historyMap = new Map([
  ['0', { log: 'Put XXX into YYY', timestamp: new Date() }],
  ['1', { log: 'Put NNN into YYY', timestamp: new Date() }],
  ['2', { log: 'Put ZZZ into YYY', timestamp: new Date() }],
  ['3', { log: 'Put GGG into CCC', timestamp: new Date() }],
  ['4', { log: 'Put JJJ into YYY', timestamp: new Date() }],
]);

const history = {
  list: (req, resp) => {
    const page = (req.query.page || 1) - 1;
    const limit = req.query.limit || 5;

    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    resp.send({
      ok: true, data: [...historyMap.entries()].map(([key, { log, timestamp }]) => { return { id: key, log: log, timestamp: timestamp }; })
        .slice(page * limit, page * limit + limit), totalCount: historyMap.size,
    });
  },
  revoke: (req, resp) => {
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    const id = req.body.id;
    if (historyMap.has(id)) {
      historyMap.delete(id);
      resp.send({ ok: true });
    } else {
      resp.status(404).send({ ok: false, err: `id ${id} not found` });
    }
  }
};

var storeMap = new Map([
  ["table", {
    amount: 10,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["monitor", {
    amount: 11,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["mouse", {
    amount: 32,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["keyboard", {
    amount: 42,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["airphone", {
    amount: 55,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["water", {
    amount: 11,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["cup", {
    amount: 32,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["desk", {
    amount: 25,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
  ["chair", {
    amount: 13,
    operator: "admin",
    place: "4356",
    ctime: new Date(),
    utime: new Date(),
    info: "N/A",
  }],
]);

const store = {
  list: (req, resp) => {
    const page = (req.query.page || 1) - 1;
    const limit = req.query.limit || 5;

    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    resp.send({
      ok: true, data: [...storeMap.entries()].map(([key, value]) => {
        return { name: key, ...value };
      }).slice(page * limit, page * limit + limit),
      totalCount: storeMap.size,
    });
  },
  in: (req, resp) => {
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    // req.body format:
    // {
    //   "name": "keyboard",
    //   "amount": 20,
    //   "operator": "9527",
    //   "place": "4444",
    //   "info": "urgent",
    // }
    const args = req.body;
    if (args.amount <= 0) {
      resp.status(400).send({ ok: false, err: `amount <= 0` });
      return;
    }

    if (storeMap.has(args.name)) {
      s = storeMap.get(args.name);
      s.amount += args.amount;
      resp.send({ ok: true });
    } else {
      storeMap.set(args.name, {
        amount: args.amount,
        operator: args.operator,
        place: args.place,
        info: args.info,
      });
      resp.send({ ok: true });
    }
  },
  out: (req, resp) => {
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    // req.body format:
    // {
    //   "name": "keyboard",
    //   "amount": 20,
    // }
    const args = req.body;
    if (storeMap.has(args.name)) {
      s = storeMap.get(args.name);

      if (s.amount < args.amount) {
        resp.status(400).send({ ok: false, err: `${args.name} not enough` });
        return;
      }

      s.amount -= args.amount;

      if (s.amount == 0) {
        storeMap.delete(args.name);
      }
      resp.send({ ok: true });
    } else {
      resp.status(404).send({ ok: false, err: `${args.name} not found` });
    }
  },
  change: (req, resp) => {
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    // req.body format:
    // {
    //   "name": "keyboard",
    //   "amount": 20,
    //   "operator": "anno",
    //   "place": "20202",
    //   "info": "<empty>",
    // }
    const args = req.body;
    if (storeMap.has(args.name)) {
      var s = storeMap.get(args.name);
      if (args.amount) {
        s.amount = args.amount;
      }
      if (args.operator) {
        s.operator = args.operator;
      }
      if (args.place) {
        s.place = args.place;
      }
      if (args.info) {
        s.info = args.info;
      }
      resp.send({ ok: true });
    } else {
      resp.status(404).send({ ok: true, data: `${args.name} not found` });
    }
  },
  search: (req, resp) => {
    const page = (req.query.page || 1) - 1;
    const limit = req.query.limit || 5;
    const pattern = req.query.pattern || '';

    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    // req.params format:
    // /store/search?pattern=keyboard
    var list = [...storeMap.entries()].map(([key, value]) => {
      return { name: key, ...value };
    });
    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      // threshold: 0.6,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      keys: [
        "name",
        "operator",
        "place",
      ]
    };
    const fuse = new Fuse(list, options);
    const res = fuse.search(pattern).map((r) => r.item);

    resp.send({ ok: true, data: res.slice(page * limit, page * limit + limit), totalCount: res.length });
  },
};

var userMap = new Map([
  ['admin', {
    password: "p@ssw0rd",
    permission: "admin",
  }],
  ['dorichan', {
    password: "123456",
    permission: "normal",
  }],
]);
var tokenToUser = new Map();

const checkToken = (token) => {
  if (tokenToUser.has(token)) {
    const username = tokenToUser.get(token);
    if (userMap.has(username)) {
      if (userMap.get(username).token == token) {
        return [true, userMap.get(username)];
      } else {
        tokenToUser.delete(token);
        return [false, 'token is expired'];
      }
    } else {
      tokenToUser.delete(token);
      return [false, 'user does not exist'];
    }
  } else {
    return [false, 'token is expired'];
  }
};

const user = {
  add: (req, resp) => {
    // req.body format:
    // {
    //   "username": "user",
    //   "password": "password",
    //   "permission": "normal",
    // }
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (isOk) {
      const user = errOrUser;
      if (user.permission != 'admin') {
        resp.status(400).send({ ok: false, err: 'permission denied' });
        return;
      } else {
        const args = req.body;
        if (args.permission != 'normal' && args.permission != 'admin') {
          resp.status(400).send({ ok: false, err: 'wrong argument: permission' });
          return;
        }
        args.username = args.username || '';
        if (args.username.length == 0) {
          resp.status(400).send({ ok: false, err: 'wrong argument: username' });
          return;
        }
        args.password = args.password || '';
        if (args.password.length == 0) {
          resp.status(400).send({ ok: false, err: 'wrong argument: password' });
          return;
        }
        if (userMap.has(args.username)) {
          resp.status(400).send({ ok: false, err: 'user exists' });
          return;
        }
        userMap.set(args.username, {
          password: args.password,
          permission: args.permission,
        });
        resp.send({ ok: true });
      }
    } else {
      resp.status(400).send({ ok: false, err: errOrUser });
    }
  },
  del: (req, resp) => {
    // req.body format:
    // {
    //   "username": "user",
    // }
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (isOk) {
      if (errOrUser.permission == 'admin') {
        resp.send({ ok: userMap.delete(args.username) });
      } else {
        resp.status(400).send({ ok: false, err: 'permission denied' });
      }
    } else {
      resp.status(400).send({ ok: false, err: errOrUser });
    }
  },
  list: (req, resp) => {
    const page = (req.query.page || 1) - 1;
    const limit = req.query.limit || 5;

    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (!isOk) {
      resp.status(400).send({ ok: false, err: errOrUser });
      return;
    }

    resp.send({
      ok: true, data: [...userMap.entries()].map(([key, value]) => {
        return { username: key, permission: value.permission };
      }).slice(page * limit, page * limit + limit), totalCount: userMap.size,
    });
  },
};

const auth = {
  login: (req, resp) => {
    // req.body format:
    // {
    //   "username": "admin",
    //   "password": "P@ssw0rd",
    // }
    const args = req.body;
    if (userMap.has(args.username)) {
      const user = userMap.get(args.username);
      if (args.password == user.password) {
        const token = util.makeToken(16);
        userMap.get(args.username).token = token;
        tokenToUser.set(token, args.username);
        resp.send({ ok: true, token: token, isAdmin: user.permission == 'admin' });
      } else {
        resp.status(400).send({ ok: false, err: 'incorrect password' });
      }
    } else {
      resp.status(404).send({ ok: false, err: `${args.usename} not found` });
    }
  },
  logout: (req, resp) => {
    const token = req.headers.authorization || '';
    const [isOk, errOrUser] = checkToken(token);
    if (isOk) {
      tokenToUser.delete(errOrUser.token);
      errOrUser.token = undefined;
      resp.send({ ok: true });
    } else {
      resp.status(400).send({ ok: false, err: errOrUser });
    }
  },
};

// app['get']('/history/list', history.list)

app.map({
  '/history': {
    get: history.list,
    '/revoke': {
      post: history.revoke
    },
  },
  '/store': {
    get: store.list,
    put: store.change,
    '/in': {
      post: store.in
    },
    '/out': {
      post: store.out
    },
    '/change': {
      post: store.change
    },
    '/search': {
      get: store.search
    },
  },
  '/user': {
    get: user.list,
    post: user.add,
    delete: user.del,
  },
  '/login': {
    post: auth.login,
  },
  '/logout': {
    post: auth.logout,
  },
});

app.use((_, resp) => {
  resp.status(404).send('not found');
});

const port = 10101;
app.listen(port, () => {
  console.log(`Material management server listening at http://localhost:${port}`);
});
