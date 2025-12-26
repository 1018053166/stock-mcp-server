import axios from 'axios';

/**
 * 股票数据爬取模块
 * 从东方财富网获取股票实时数据
 */
export class StockDataFetcher {
  constructor() {
    this.baseUrl = 'https://push2.eastmoney.com/api/qt/stock/get';
    this.klineUrl = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
    this.rankUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
    this.holderUrl = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
  }

  /**
   * 格式化股票代码
   * @param {string} stockCode - 股票代码(如: 000001, 600000)
   * @returns {string} 格式化后的代码(如: 0.000001, 1.600000)
   */
  formatStockCode(stockCode) {
    const code = stockCode.trim();
    // 深圳A股(000, 002, 300开头)
    if (code.startsWith('000') || code.startsWith('002') || code.startsWith('300')) {
      return `0.${code}`;
    }
    // 上海A股(600, 601, 603, 605, 688开头)
    if (code.startsWith('60') || code.startsWith('688')) {
      return `1.${code}`;
    }
    // 北交所(8开头)
    if (code.startsWith('8')) {
      return `0.${code}`;
    }
    return `1.${code}`; // 默认上海
  }

  /**
   * 获取股票实时数据
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Object>} 股票数据
   */
  async getStockData(stockCode) {
    try {
      const secid = this.formatStockCode(stockCode);
      const params = {
        secid: secid,
        fields: 'f57,f58,f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f60,f107,f152,f161,f162,f163,f164,f165,f168,f169,f170,f171,f177,f292',
        ut: 'fa5fd1943c7b386f172d6893dbfba10b',
        fltt: '2',
        invt: '2'
      };

      const response = await axios.get(this.baseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        return this.parseStockData(response.data.data, stockCode);
      }
      
      throw new Error('获取数据失败');
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} 数据失败: ${error.message}`);
    }
  }

  /**
   * 解析股票数据
   * @param {Object} data - 原始数据
   * @param {string} stockCode - 股票代码
   * @returns {Object} 解析后的数据
   */
  parseStockData(data, stockCode) {
    return {
      stockCode: stockCode,
      stockName: data.f58 || '',
      currentPrice: data.f43 || 0,
      changePercent: data.f170 || 0,
      changeAmount: data.f169 || 0,
      openPrice: data.f46 || 0,
      highPrice: data.f44 || 0,
      lowPrice: data.f45 || 0,
      previousClose: data.f60 || 0,
      volume: data.f47 || 0,
      turnover: data.f48 || 0,
      amplitude: data.f50 || 0,
      turnoverRate: data.f168 || 0,
      totalMarketCap: data.f116 || 0,
      circulationMarketCap: data.f117 || 0,
      pe: data.f162 || 0,
      pb: data.f167 || 0,
      updateTime: new Date().toISOString()
    };
  }

  /**
   * 批量获取股票数据
   * @param {Array<string>} stockCodes - 股票代码数组
   * @returns {Promise<Array>} 股票数据数组
   */
  async batchGetStockData(stockCodes) {
    const results = [];
    for (const code of stockCodes) {
      try {
        const data = await this.getStockData(code);
        results.push(data);
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({ stockCode: code, error: error.message });
      }
    }
    return results;
  }

  /**
   * 搜索股票(简单实现，可扩展)
   * @param {string} keyword - 关键词(股票代码或名称)
   * @returns {Promise<Object>} 搜索结果
   */
  async searchStock(keyword) {
    try {
      // 如果是6位数字，直接当作股票代码查询
      if (/^\d{6}$/.test(keyword)) {
        return await this.getStockData(keyword);
      }
      
      // 使用东方财富搜索接口
      const searchUrl = 'https://searchapi.eastmoney.com/api/suggest/get';
      const params = {
        input: keyword,
        type: '14',
        token: 'D43BF722C8E33BDC906FB84D85E326E8',
        count: '5'
      };
      
      const response = await axios.get(searchUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.QuotationCodeTable && response.data.QuotationCodeTable.Data) {
        return response.data.QuotationCodeTable.Data.map(item => ({
          stockCode: item.Code,
          stockName: item.Name,
          market: item.MarketType,
          type: item.SecurityTypeName
        }));
      }
      
      return [];
    } catch (error) {
      throw new Error(`搜索股票失败: ${error.message}`);
    }
  }

  /**
   * 获取K线数据
   * @param {string} stockCode - 股票代码
   * @param {string} period - 周期(日k/周k/月k/1/5/15/30/60分钟)
   * @param {number} count - 获取数量
   * @returns {Promise<Object>} K线数据
   */
  async getKlineData(stockCode, period = '101', count = 100) {
    try {
      const secid = this.formatStockCode(stockCode);
      const params = {
        secid: secid,
        fields1: 'f1,f2,f3,f4,f5,f6',
        fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
        klt: period,
        fqt: '1',
        beg: '0',
        end: '20500101',
        lmt: count,
        ut: 'fa5fd1943c7b386f172d6893dbfba10b'
      };

      const response = await axios.get(this.klineUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        return {
          stockCode: stockCode,
          stockName: data.name,
          klines: data.klines ? data.klines.map(k => {
            const parts = k.split(',');
            return {
              date: parts[0],
              open: parseFloat(parts[1]),
              close: parseFloat(parts[2]),
              high: parseFloat(parts[3]),
              low: parseFloat(parts[4]),
              volume: parseFloat(parts[5]),
              turnover: parseFloat(parts[6]),
              changePercent: parseFloat(parts[8])
            };
          }) : []
        };
      }
      
      throw new Error('获取K线数据失败');
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} K线数据失败: ${error.message}`);
    }
  }

  /**
   * 获取涨跌幅排行
   * @param {string} type - 类型(up涨幅/down跌幅)
   * @param {number} count - 数量
   * @returns {Promise<Array>} 排行榜数据
   */
  async getRankList(type = 'up', count = 20) {
    try {
      const sortField = type === 'up' ? 'f3' : 'f3';
      const sortType = type === 'up' ? '-1' : '1';
      
      const params = {
        pn: '1',
        pz: count.toString(),
        po: sortType,
        np: '1',
        ut: 'fa5fd1943c7b386f172d6893dbfba10b',
        fltt: '2',
        invt: '2',
        fid: sortField,
        fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
        fields: 'f12,f14,f2,f3,f4,f5,f6,f7,f15,f16,f17,f18'
      };

      const response = await axios.get(this.rankUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map(item => ({
          stockCode: item.f12,
          stockName: item.f14,
          currentPrice: item.f2,
          changePercent: item.f3,
          changeAmount: item.f4,
          volume: item.f5,
          turnover: item.f6,
          amplitude: item.f7,
          high: item.f15,
          low: item.f16,
          open: item.f17,
          previousClose: item.f18
        }));
      }
      
      return [];
    } catch (error) {
      throw new Error(`获取排行榜失败: ${error.message}`);
    }
  }

  /**
   * 获取行业板块排行
   * @param {number} count - 数量
   * @returns {Promise<Array>} 板块数据
   */
  async getSectorRank(count = 20) {
    try {
      const params = {
        pn: '1',
        pz: count.toString(),
        po: '1',
        np: '1',
        ut: 'fa5fd1943c7b386f172d6893dbfba10b',
        fltt: '2',
        invt: '2',
        fid: 'f3',
        fs: 'm:90+t:2',
        fields: 'f12,f14,f2,f3,f4,f8,f104,f105,f106,f107'
      };

      const response = await axios.get(this.rankUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map(item => ({
          sectorCode: item.f12,
          sectorName: item.f14,
          changePercent: item.f3,
          turnover: item.f8,
          leadingStock: item.f104,
          leadingStockPrice: item.f105
        }));
      }
      
      return [];
    } catch (error) {
      throw new Error(`获取板块排行失败: ${error.message}`);
    }
  }

  /**
   * 获取市场概况
   * @returns {Promise<Object>} 市场概况数据
   */
  async getMarketOverview() {
    try {
      // 获取上证指数
      const sh = await this.getStockData('000001', '1.');
      // 获取深证成指
      const sz = await this.getStockData('399001', '0.');
      // 获取创业板指
      const cyb = await this.getStockData('399006', '0.');
      
      return {
        shanghai: {
          name: '上证指数',
          ...sh
        },
        shenzhen: {
          name: '深证成指',
          ...sz
        },
        chinext: {
          name: '创业板指',
          ...cyb
        },
        updateTime: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`获取市场概况失败: ${error.message}`);
    }
  }

  /**
   * 获取股票数据（支持自定义市场代码）
   * @param {string} stockCode - 股票代码
   * @param {string} marketPrefix - 市场前缀
   * @returns {Promise<Object>} 股票数据
   */
  async getStockData(stockCode, marketPrefix = null) {
    try {
      const secid = marketPrefix ? `${marketPrefix}${stockCode}` : this.formatStockCode(stockCode);
      const params = {
        secid: secid,
        fields: 'f57,f58,f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f60,f107,f152,f161,f162,f163,f164,f165,f168,f169,f170,f171,f177,f292',
        ut: 'fa5fd1943c7b386f172d6893dbfba10b',
        fltt: '2',
        invt: '2'
      };

      const response = await axios.get(this.baseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        return this.parseStockData(response.data.data, stockCode);
      }
      
      throw new Error('获取数据失败');
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} 数据失败: ${error.message}`);
    }
  }

  /**
   * 获取股东人数数据
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Object>} 股东人数数据
   */
  async getShareholderCount(stockCode) {
    try {
      const params = {
        reportName: 'RPT_F10_EH_HOLDERNUM',
        columns: 'ALL',
        filter: `(SECUCODE="${stockCode}")`,
        pageNumber: '1',
        pageSize: '20',
        sortTypes: '-1',
        sortColumns: 'END_DATE',
        source: 'WEB',
        client: 'WEB'
      };

      const response = await axios.get(this.holderUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.result && response.data.result.data) {
        const data = response.data.result.data;
        return {
          stockCode: stockCode,
          shareholderData: data.map(item => ({
            endDate: item.END_DATE,
            holderNum: item.HOLDER_NUM,
            holderNumChange: item.HOLDER_NUM_CHANGE,
            holderNumChangeRate: item.HOLDER_NUM_CHANGE_RATIO,
            avgHoldingAmount: item.AVG_MARKET_CAP,
            avgHoldingAmountChange: item.AVG_MARKET_CAP_CHANGE_RATIO,
            totalMarketCap: item.TOTAL_MARKET_CAP,
            totalAShares: item.TOTAL_A_SHARES,
            period: item.INTERVAL_CHRATE
          })),
          latestHolderNum: data[0]?.HOLDER_NUM || 0,
          latestChange: data[0]?.HOLDER_NUM_CHANGE || 0,
          latestChangeRate: data[0]?.HOLDER_NUM_CHANGE_RATIO || 0,
          updateTime: new Date().toISOString()
        };
      }
      
      return { stockCode, shareholderData: [], message: '暂无股东数据' };
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} 股东数据失败: ${error.message}`);
    }
  }

  /**
   * 获取十大流通股东
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Object>} 十大流通股东数据
   */
  async getTopTenHolders(stockCode) {
    try {
      const params = {
        reportName: 'RPT_F10_EH_FREEHOLDERS',
        columns: 'ALL',
        filter: `(SECUCODE="${stockCode}")`,
        pageNumber: '1',
        pageSize: '10',
        sortTypes: '-1,-1',
        sortColumns: 'END_DATE,HOLDER_RANK',
        source: 'WEB',
        client: 'WEB'
      };

      const response = await axios.get(this.holderUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.result && response.data.result.data) {
        const data = response.data.result.data;
        return {
          stockCode: stockCode,
          reportDate: data[0]?.END_DATE || '',
          holders: data.map(item => ({
            rank: item.HOLDER_RANK,
            holderName: item.HOLDER_NAME,
            holderType: item.HOLDER_TYPE,
            holdNum: item.HOLD_NUM,
            holdRatio: item.FREE_HOLDNUM_RATIO,
            holdChange: item.HOLD_NUM_CHANGE,
            changeRatio: item.CHANGE_RATIO
          })),
          updateTime: new Date().toISOString()
        };
      }
      
      return { stockCode, holders: [], message: '暂无十大股东数据' };
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} 十大股东失败: ${error.message}`);
    }
  }

  /**
   * 获取股东增长趋势分析
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Object>} 股东增长趋势
   */
  async getShareholderTrend(stockCode) {
    try {
      const data = await this.getShareholderCount(stockCode);
      
      if (data.shareholderData.length === 0) {
        return { stockCode, trend: 'unknown', message: '数据不足' };
      }

      const recent = data.shareholderData.slice(0, 4);
      const increases = recent.filter(d => d.holderNumChange > 0).length;
      const decreases = recent.filter(d => d.holderNumChange < 0).length;
      
      // 计算平均变化率
      const avgChangeRate = recent.reduce((sum, d) => sum + (d.holderNumChangeRate || 0), 0) / recent.length;
      
      let trend = 'stable';
      let trendDesc = '稳定';
      
      if (increases >= 3) {
        trend = 'increasing';
        trendDesc = '持续增长';
      } else if (decreases >= 3) {
        trend = 'decreasing';
        trendDesc = '持续下降';
      } else if (avgChangeRate > 2) {
        trend = 'rising';
        trendDesc = '上升趋势';
      } else if (avgChangeRate < -2) {
        trend = 'falling';
        trendDesc = '下降趋势';
      }

      return {
        stockCode: stockCode,
        trend: trend,
        trendDescription: trendDesc,
        avgChangeRate: avgChangeRate.toFixed(2),
        recentData: recent,
        analysis: {
          increasePeriods: increases,
          decreasePeriods: decreases,
          totalPeriods: recent.length,
          latestHolderNum: data.latestHolderNum,
          latestChange: data.latestChange,
          latestChangeRate: data.latestChangeRate
        },
        updateTime: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`获取股票 ${stockCode} 股东趋势失败: ${error.message}`);
    }
  }
}
