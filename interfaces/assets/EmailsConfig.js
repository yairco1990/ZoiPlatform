module.exports = {
	newCustomerEmail: {
		subject: "Welcome to {{business name}}",
		line1: "Hi {{firstName}},",
		line2: "We are happy to welcome you to {{business name}}.",
		line3: "We work hard in order for you to enjoy our services.",
		line4: "",
		bannerImage: "http://res.cloudinary.com/gotime-systems/image/upload/v1501100784/new_customer_welcome_1-01_qitgol.png",
		hoverColor: "#DC1A22",
		color: "#F67C2B",
		buttonText: "Book Here"
	},
	oldCustomersEmail: {
		subject: "We missed you",
		line1: "Hi {{firstName}},",
		line2: "We really miss you here at {{business name}} and we really want to see you again.",
		line3: "We have a special offer for you!",
		line4: "Book for {{service}} today and enjoy {{discount type}} deal.",
		bannerImage: "http://res.cloudinary.com/gotime-systems/image/upload/v1501100340/missed_you_banner-01_ginwi7.png",
		hoverColor: "#DC1A22",
		color: "#F67C2B",
		buttonText: "I Want It!"
	},
	promotionsEmail: {
		subject: "We have a special offer",
		line1: "Hi {{firstName}},",
		line2: "We at {{business name}} value our customers and always find ways to make you happy. ",
		line3: "We have a special offer for you!",
		line4: "Book for {{service}} today and enjoy <b>{{discount type}}</b> deal.</p>",
		buttonText: "I Want It!"
	}
};