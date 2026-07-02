import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHost, hostMatches, isAllowlisted } from "../common/matching.mjs";

test("normalizeHost: регистр, точка, www", () => {
  assert.equal(normalizeHost("WWW.Example.COM."), "example.com");
  assert.equal(normalizeHost("sub.site.ru"), "sub.site.ru");
  assert.equal(normalizeHost("  habr.com  "), "habr.com");
  assert.equal(normalizeHost(""), "");
  assert.equal(normalizeHost(undefined), "");
  assert.equal(normalizeHost(null), "");
});

test("hostMatches: точное совпадение и поддомены", () => {
  assert.equal(hostMatches("example.com", "example.com"), true);
  assert.equal(hostMatches("a.example.com", "example.com"), true);
  assert.equal(hostMatches("a.b.example.com", "example.com"), true);
});

test("hostMatches: границы доменов (классическая ошибка суффикса)", () => {
  assert.equal(hostMatches("evil-example.com", "example.com"), false);
  assert.equal(hostMatches("notexample.com", "example.com"), false);
  assert.equal(hostMatches("example.com.evil.ru", "example.com"), false);
  assert.equal(hostMatches("", "example.com"), false);
  assert.equal(hostMatches("example.com", ""), false);
});

test("isAllowlisted: нормализует хост и работает с поддоменами", () => {
  assert.equal(isAllowlisted("www.habr.com", ["habr.com"]), true);
  assert.equal(isAllowlisted("news.habr.com", ["habr.com"]), true);
  assert.equal(isAllowlisted("habr.com", ["example.com"]), false);
  assert.equal(isAllowlisted("habr.com", []), false);
  assert.equal(isAllowlisted("habr.com", null), false);
  assert.equal(isAllowlisted("habr.com", undefined), false);
});
