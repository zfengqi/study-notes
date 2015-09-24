function SalesTaxesCalculator() {
    this.tax = {
        basic: 0.1,
        import: 0.05
    };

    this.basicExemptions = {
        book: ['book'],
        food: ['chocolate'],
        med: ['pill']
    };

    this.totalTaxes = 0;

    // 不含税总价格
    this.totalPrices = 0;
}

/**
 * 总入口
 *
 * @param  {string} dataChunk 多行数据文本
 * @return {string} 最终计算结果
 */
SalesTaxesCalculator.prototype.run = function (dataChunk) {
    // 清空total
    this.totalPrices = 0;
    this.totalTaxes = 0;

    var itemArr = dataChunk.split(/\r\n|\r|\n/g);
    var priceWithTaxes = 0;

    var itemInfo = null;
    var outputText = '';
    var outputArr = [];

    for (var i = 0; i < itemArr.length; i++) {
        priceWithTaxes = this.calculate(itemArr[i]);
        itemInfo = this.analyse(itemArr[i]);

        outputArr.push(itemInfo.count + ' ' + itemInfo.product + ': ' + priceWithTaxes.toFixed(2));
    }

    outputArr.push('Sales Taxes: ' + this.totalTaxes.toFixed(2));
    outputArr.push('Total: ' + (this.totalPrices + this.totalTaxes).toFixed(2));

    return outputArr.join('\r\n');
};


/**
 * 是否为进口商品
 *
 * @param {string} name 商品相关信息(通过正则匹配)
 * @return {boolean}
 */
SalesTaxesCalculator.prototype.isImport = function (name) {
    if (/import/.test(name)) {
        return true;
    }

    return false;
};


/**
 *  是否为basic tax免税商品
 *
 * @param {string} name 商品相关信息(正则匹配)
 * @return {boolean}
 */
SalesTaxesCalculator.prototype.isExemptions = function (name) {
    var exemptions = this.basicExemptions;
    var reg;

    for (var key in exemptions) {
        if (exemptions.hasOwnProperty(key)) {

            for (var i = 0; i < exemptions[key].length; i++) {
                reg = new RegExp(exemptions[key][i]);

                if (reg.test(name)) {
                    return true;
                }
            }
        }
    }

    return false;
};


/**
 * 获取单条记录的商品含税价格
 *
 * @param {string} data 单行记录
 * @return 含税价格
 */
SalesTaxesCalculator.prototype.calculate = function (data) {
    var dataObj = this.analyse(data);

    var productInfo = dataObj.product;
    var count = dataObj.count;
    var price = dataObj.price;
    var priceWithoutTaxes = price * count;
    var taxRate = 0;
    var finalTax = 0;

    if (this.isImport(productInfo)) {
        taxRate += this.tax['import'];
    }

    if (!this.isExemptions(productInfo)) {
        taxRate += this.tax['basic'];
    }

    if (taxRate !== 0) {
        var tax = (taxRate * price).toFixed(3);
        tax = tax.substring(0, tax.length - 1);
        finalTax = count * this.roundToPercent5(tax);
    }

    this.totalTaxes += finalTax;
    this.totalPrices += priceWithoutTaxes;

    return finalTax + priceWithoutTaxes;
};

/**
 * 向上取0.05的倍数 rounded up to the nearest 0.05
 *
 * @param {string} tax 未取整的税额
 * @return {number} 取整后税额
 */
SalesTaxesCalculator.prototype.roundToPercent5 = function (tax) {
    var start = tax.replace(/\d$/, '0');
    var end = (+start + 0.1).toFixed(2);
    // 浮点数精度问题 烦人
    // 取xx.x5
    var pivot = parseInt((+start + +end) / 2 * 100);
    tax = parseInt(tax * 100);

    var delta = pivot - tax;
    if (delta === 5) {
        return tax / 100;
    }
    else if (delta >= 0) {
        return pivot / 100;
    }
    else {
        return +end;
    }
};


/**
 * 分析单行数据
 *
 * @param {string} data 输入源-单行数据文本
 * @return {Object} 解析后的数据对象 {商品数量、商品信息、商品价格}
 */
// data: 1 imported bottle of perfume at 47.50
SalesTaxesCalculator.prototype.analyse = function (data) {
    data = data.trim();
    var tempArr = data.split(/\sat\s/);
    var price = tempArr[1];

    var tempArr2 = tempArr[0].split(/\s/);
    var count = tempArr2.shift();
    var product = tempArr2.join(' ');

    return {
        count: +count,
        product: product,
        price: +price
    }
};

var INPUT = '1 book at 12.49 \r\n 1 music CD at 14.99 \r\n 1 chocolate bar at 0.85';
// var INPUT = '1 imported box of chocolates at 10.00 \r\n 1 imported bottle of perfume at 47.50 ';
// var INPUT = '1 imported bottle of perfume at 27.99 \r\n 1 bottle of perfume at 18.99 \r\n 1 packet of headache pills at 9.75 \r\n 1 box of imported chocolates at 11.25 ';

var cal = new SalesTaxesCalculator();
console.log(cal.run(INPUT));
