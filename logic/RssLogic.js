const ZoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const ogs = require('open-graph-scraper');
const requestify = require('requestify');

let rssCache;

class RssLogic {

    static async getRandomArticles(category, keyWords, numOfArticles) {

        try {
            let keyWordsString = "";
            keyWords.forEach((k) => {
                keyWordsString += k + " ";
            });
            keyWordsString = keyWordsString.trim();

            let result = await requestify.post(ZoiConfig.ELASTIC_URL + '/articles/_search', {
                "query": {
                    "bool": {
                        "must": {
                            "match_phrase": {
                                "tags": category
                            }
                        },
                        "should": {
                            "match": {
                                "message": keyWordsString
                            }
                        }
                    }
                },
                "sort": [
                    {
                        "published": {
                            "order": "desc"
                        }
                    }
                ],
                "size": 40
            }, {dataType: 'json'});

            const hits = result.getBody().hits.hits;

            let articles = hits.map((article) => {
                return article._source;
            });

            const numOfLinksToExtract = Math.min(articles.length, numOfArticles);

            articles = MyUtils.getRandomFromArray(articles, numOfLinksToExtract);

            for (let article of articles) {
                const openGraphResult = await RssLogic.getOpenGraphResult(article.link);
                article.image = openGraphResult.ogImage.url;
            }

            return articles;

		} catch (e) {
			MyLog.error('Failed to load random articles', 3);
		}

    }


    static async getAllArticles() {

        try {
            //check if request already made
            if (!rssCache) {

                const articles_1 = await RssLogic.getArticles('http://www.beautyworldnews.com/rss/archives/all.xml');
                const articles_2 = await RssLogic.getArticles('http://www.nytimes.com/svc/collections/v1/publish/www.nytimes.com/section/well/rss.xml');
                const articles_3 = await RssLogic.getArticles('http://rss.nytimes.com/services/xml/rss/nyt/Nutrition.xml');
                const articles_4 = await RssLogic.getArticles('http://www.health.com/fitness/feed');
                const articles_5 = await RssLogic.getArticles('http://www.health.com/mind-body/feed');

                rssCache = [...articles_1, ...articles_2, ...articles_3, ...articles_4, ...articles_5];

            }

            return rssCache;

        } catch (err) {
            MyLog.error("Failed to get rss articles", err);
        }
    }

    /**
     * get articles from single url
     * @param url
     * @returns list of articles on array
     */
    static async getArticles(url) {

        //get articles on xml
        const articlesOnXml = await MyUtils.makeRequest('GET', url);

        //convert xml to js
        const articlesOnJson = await MyUtils.convertXmlToJson(articlesOnXml);

        //return list of article items
        return articlesOnJson.rss.channel[0].item;

    }

    /**
     * get page metadata by open graph
     * @param url
     * @returns {Promise}
     */
    static async getOpenGraphResult(url) {
        return new Promise((resolve, reject) => {
            const options = {'url': url};
            ogs(options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                resolve(result.data);
            });
        });
    }
}

module.exports = RssLogic;