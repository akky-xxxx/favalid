import * as assert from "power-assert";
import {
  asyncExec,
  asyncExecWithReducer,
  asyncTester,
  defaultReducer,
  ResultReducer,
  exec,
  execWithReducer,
  Messager,
  Test,
  tester,
  toAsync
} from "../core";

describe("tester", () => {
  test("no error", () => {
    const test: Test = () => true;
    const message: Messager = () => "";
    const result = tester(test, message)();
    assert.deepStrictEqual(result, {
      error: false,
      message: ""
    });
  });
  test("has error", () => {
    const test = () => false;
    const message = () => "error";
    const result = tester(test, message)();
    assert.deepStrictEqual(result, {
      error: true,
      message: "error"
    });
  });
});

describe("execWithReducer", () => {
  test("exec multiple tests", () => {
    let called = 0;
    const testerMaker = () =>
      tester(() => {
        called++;
        return true;
      }, () => "");
    const reducer: ResultReducer = (m, e) => {
      if (m.error) {
        return m;
      }
      return e;
    };
    execWithReducer(reducer, testerMaker(), testerMaker());
    assert.strictEqual(2, called);
  });
});

describe("exec", () => {
  test("should return first validate failure", () => {
    const tester1 = tester(() => true, () => "test1");
    const tester2 = tester(() => false, () => "test2");
    const tester3 = tester(() => true, () => "test3");
    const e = exec(tester1, tester2, tester3);

    assert.deepStrictEqual(e, {
      error: true,
      message: "test2"
    });
  });
});

describe("async", () => {
  test("basic", async () => {
    const validator = asyncTester(() => {
      return Promise.resolve(true);
    }, () => "");

    assert.deepStrictEqual(await validator(), {
      error: false,
      message: ""
    });
  });

  test("should be invalid", async () => {
    const validator = asyncTester(() => {
      return Promise.resolve(false);
    }, () => "error");

    assert.deepStrictEqual(await validator(), {
      error: true,
      message: "error"
    });
  });

  test("fail Promise.resolve", async () => {
    const validator = asyncTester(() => {
      return Promise.reject(new Error("message"));
    }, () => "error");

    assert.deepStrictEqual(await validator(), {
      error: true,
      message: "error"
    });
  });

  test("with async function", async () => {
    const validator = asyncTester(async () => {
      return true;
    }, () => "");

    assert.deepStrictEqual(await validator(), {
      error: false,
      message: ""
    });
  });
});

describe("asyncExec (with Reducer)", () => {
  test("exec multiple asyncTesters", async () => {
    const tester1 = asyncTester(() => Promise.resolve(true), () => "test3");
    const tester2 = asyncTester(() => Promise.resolve(true), () => "test3");
    const e = await asyncExecWithReducer(defaultReducer, tester1, tester2);

    assert.deepStrictEqual(e, {
      error: false,
      message: ""
    });
  });

  test("reports first failed test", async () => {
    const tester1 = asyncTester(() => Promise.resolve(true), () => "test1");
    const tester2 = asyncTester(
      () => Promise.reject(new Error("error")),
      () => "test2"
    );
    const tester3 = asyncTester(() => Promise.resolve(true), () => "test3");
    const e = await asyncExecWithReducer(
      defaultReducer,
      tester1,
      tester2,
      tester3
    );

    assert.deepStrictEqual(e, {
      error: true,
      message: "test2"
    });
  });
});

describe("asyncExec", () => {
  test("exec multiple asyncTesters", async () => {
    const tester1 = asyncTester(() => Promise.resolve(true), () => "test1");
    const tester2 = asyncTester(
      () => Promise.reject(new Error("error")),
      () => "test2"
    );
    const tester3 = asyncTester(() => Promise.resolve(true), () => "test3");
    const e = await asyncExec(tester1, tester2, tester3);

    assert.deepStrictEqual(e, {
      error: true,
      message: "test2"
    });
  });
});

describe("converToAsync", () => {
  test("convert to asyncTeter", async () => {
    const tester1 = asyncTester(() => Promise.resolve(true), () => "");
    const tester2 = tester(() => false, () => "test2");
    const tester3 = tester(() => true, () => "");
    const e = await asyncExec(tester1, toAsync(tester2), toAsync(tester3));

    assert.deepStrictEqual(e, {
      error: true,
      message: "test2"
    });
  });
});
