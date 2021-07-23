// pages/map/map.js
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mapId: 'myMap',
    mapKey: 'UBTBZ-JSI66-ZEASC-MWJNI-TQ5EE-KMFL4',
    mapSig: 'hr5QZnlTtWts27X0o2ma7vGLfGuYp6W',  //开启WebServiceAPI签名校验的必传参数
    longitude: '',
    latitude: '',
    scale: 16,
    minScale: 3,
    maxScale: 20,

    // 车辆标记
    markersData: [
      {
        id: 1,
        // clusterId: 1,
        // joinCluster: true,
        latitude: "31.232440887925165",
        longitude: "121.4848781618025",
        title: '踏板1代',
        iconPath: '/static/car.png',
        width: 30,
        height: 30
      },
      {
        id: 2,
        latitude: "31.23146866234145",
        longitude: "121.48562901473497",
        title: '踏板2代',
        iconPath: '/static/car.png',
        width: 30,
        height: 30
      },
      {
        id: 3,
        latitude: "31.23038636170188",
        longitude: "121.48524286180646",
        title: '踏板3代',
        iconPath: '/static/car.png',
        width: 30,
        height: 30
      }

    ],

    // 圆圈
    circlesData:[{
        latitude: '31.231458971849786',
        longitude: '121.48465772387374',
        color: '#FF0000DD',
        fillColor: '#7cb5ec88',
        radius: 300,
        strokeWidth: 1
    }],
    
    // 多边形
    polygonsData: [],

    // 路线
    polylineData: [],

    // 计时器
    h: '00',
    m: '00',
    s: '00',

    curAddress: '扫码开锁'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getLocationFn()
    this.queryTime()
    
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
        key: this.data.mapKey
    })
  },

  // 开启小程序进入前台时接收位置消息
  startLocationUpdateFn(){
    wx.startLocationUpdate({
      success: (res) => {
        console.log(res, "开启小程序进入前台时接收位置消息")
      },
    })
  },
  // 开启小程序进入前后台时均接收位置消息
  startLocationUpdateBackgroundFn(){
    wx.startLocationUpdateBackground({
      success: (res) => {
        console.log(res, "开启小程序进入前后台时均接收位置消息")
      },
    })
  },

  // 获取当前地址
  getLocationFn(){
    let that = this
    wx.getLocation({
      type: 'gcj02',
      success (res) {
        console.log(res, "获取当前地址")
        if(typeof res == 'object'){
          // that.reverseGeocoderFn({latitude: res.latitude, longitude: res.longitude})
          that.setData({
            longitude: res.longitude,
            latitude: res.latitude,
            speed: res.speed,
            accuracy: res.accuracy
          })
        }
      }
     })
  },

  // 监听实时地理位置变化
  onLocationChangeFn(){
    wx.onLocationChange((res)=>{
      console.log(res, "监听实时地理位置变化")
    })
  },

  // 逆地址解析（坐标 -> 地址）
  reverseGeocoderFn(location){
    let that = this;
    qqmapsdk.reverseGeocoder({
      location: location,
      coord_type: 5,
      get_poi: 0,
      sig: that.data.mapSig,  //开启WebServiceAPI签名校验的必传参数
      success: function(res){
        console.log(res, "逆地址解析")
        if(res.status == 0 && typeof res.result == 'object'){
          that.setData({
            curAddress: res.result.address 
          })
        }
      },
      fail: function(err){
        console.log(err, "逆地址解析失败")
      }
    })
  },
  
  // 地址解析 (地址 -> 坐标) 地址中请包含城市名称
  geocoderFn(address){
    let that = this
    qqmapsdk.geocoder({
      address: address,
      region: '',
      sig: that.data.mapSig,  //开启WebServiceAPI签名校验的必传参数
      success: function(res){
        console.log(res, "地址解析")
        if(res.status == 0 && typeof res.result == 'object'){
          console.log(res.result.location)
        }
      },
      fail: function(err){
        console.log(err, '地址解析失败')
      }
    })
  },

  // 提供路线规划能力
  directionFn(from, to){
    let that = this;
    qqmapsdk.direction({
      mode: 'bicycling',  //‘driving’（驾车）、‘walking’（步行）、‘bicycling’（骑行）、‘transit’（公交）
      from: from,
      to: to,
      sig: that.data.mapSig,
      success: function(res){
        console.log(res, "提供路线规划能力")
        if(res.status == 0 && typeof res.result == 'object'){
          let polyline = res.result.routes[0].polyline
          let pl = []
          //坐标解压（返回的点串坐标，通过前向差分进行压缩）
          for (var i = 2; i < polyline.length ; i++){
            polyline[i] = polyline[i-2] + polyline[i]/1000000
          }
          //将解压后的坐标放入点串数组pl中
          for (var i = 0; i < polyline.length; i += 2) {
            pl.push({ latitude: polyline[i], longitude: polyline[i + 1] })
          }
          //设置polyline属性，将路线显示出来,将解压坐标第一个数据作为起点
          that.setData({
            latitude: pl[0].latitude,
            longitude: pl[0].longitude,
            polylineData: [{
              points: pl,
              color: '#FF0000DD',
              width: 4
            }]
          })
        }
      },
      fail: function(err){
        console.log(err, '路线规划error')
      }
    })
  },

  // 点击地图触发
  bindTap(e) {
    // console.log(e, '点击地图触发')
  },

  // 点击标记点触发
  bindMarkerTap(e){
    // console.log(e, '点击标记点触发')
    let markersData = this.data.markersData
    let markerId = e.detail.markerId
    let current = (markersData || []).findIndex((item) => item.id === markerId)
    console.log(current, "当前车下标")
    // 调用规划线路
    this.directionFn(
      {latitude: this.data.latitude, longitude: this.data.longitude},
      {latitude: markersData[current].latitude, longitude: markersData[current].longitude}
    )
  },

  // 在地图渲染更新完成时触发
  bindUpdated(e){
    // console.log(e, '在地图渲染更新完成时触发')
  },

  // 视野发生变化时触发
  bindRegionChange(e){
    // console.log(e, '视野发生变化时触发')
  },

  // 回到当前视野
  moveTolocation(){
    var mapCtx = wx.createMapContext(this.data.mapId) //wxml中map标签的id值
    mapCtx.moveToLocation()
  },

  // 计时器
  queryTime(){
    let that = this;
    let hou = that.data.h
    let min = that.data.m
    let sec = that.data.s

    setInterval(()=>{
      sec++
      if(sec >= 60){
        sec = 0
        min++
        if(min >=60){
          min = 0
          hou++
          that.setData({
            h: (hou < 10 ? '0'+hou : hou)
          })
        }
        that.setData({
          m: (min < 10 ? '0'+min : min)
        })
      }
      that.setData({
        s: (sec < 10 ? '0'+sec : sec)
      })
    }, 1000)
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})