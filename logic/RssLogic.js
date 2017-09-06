const ZoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const ogs = require('open-graph-scraper');

let rssCache;

class RssLogic {

	static async getRandomArticle() {

		const allArticles = await RssLogic.getAllArticles();

		const randomArticle = MyUtils.getRandomValueFromArray(allArticles);

		const formattedArticle = {
			title: MyUtils.replaceAll('&nbsp', ' ', MyUtils.clearHtmlSigns(randomArticle.title[0])),
			link: randomArticle.link[0],
			description: MyUtils.clearHtmlSigns(randomArticle.description[0]),
			image: randomArticle["media:content"] && randomArticle["media:content"][0] && randomArticle["media:content"][0].url ? randomArticle["media:content"][0].url : null
		};

		if (!formattedArticle.image) {
			const pageMetadata = await RssLogic.getOpenGraphResult(formattedArticle.link);
			formattedArticle.image = MyUtils.nestedValue(pageMetadata, "data.ogImage.url");
		}

		if (!formattedArticle.image) {
			formattedArticle.image = "http://res.cloudinary.com/gotime-systems/image/upload/v1504626524/ArticleDefaultImage_no2tdq.jpg";
		}

		return formattedArticle;
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
			ogs(options, function (err, results) {
				if (err) {
					return reject(err);
				}
				resolve(results);
			});
		});
	}
}

module.exports = RssLogic;