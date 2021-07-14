import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
var config = require('../../../config.js');

const App = (props) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('overall');
  const [anonymous, setAnon] = useState(true);
  const [size, setSize] = useState(-1);
  const [data, setData] = useState({ artists: [], img: '' });

  const lfmLogin = (e) => {
    e.preventDefault();
    window.location.href = `http://www.last.fm/api/auth/?api_key=${config.key}&cb=http://localhost:3000/auth`;
  };

  const lfmGetArtists = (e) => {
    e.preventDefault();
    const options = {
      method: 'POST',
      body: JSON.stringify({ name: name }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    }
    fetch('http://localhost:3000/artists', options).then(api_res => api_res.json()).then(res => {
      setData(d => {
        var nd = { ...d };
        nd.artists = res;
        return nd;
      });
    });
  };

  const lfmGetAlbums = (e) => {
    e.preventDefault();
    const options = {
      method: 'POST',
      body: JSON.stringify({ name: name, period: period, anonymous: anonymous, size: size }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    };
    fetch('http://localhost:3000/albums', options).then(api_res => api_res.text()).then(res => {
      if (!res) {
        setError('Request failed')
      } else {
        setData(d => {
          var nd = { ...d };
          nd.img = res;
          return nd;
        });
      }
    });
  };

  const lfmGetTag = (e) => {
    e.preventDefault();
    const options = {
      method: 'POST',
      body: JSON.stringify({ name: name, tag: tag, period: period, anonymous: anonymous, size: size }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    };
    fetch('http://localhost:3000/tags', options).then(api_res => api_res.text()).then(res => {
      if (!res) {

      } else {
        setData(d => {
          var nd = { ...d };
          nd.img = res;
          return nd;
        });
      }
    });
  };

  const lfmGetSample = (e) => {
    const options = {
      method: 'POST',
      body: JSON.stringify({ name: name, anonymous: anonymous, size: size }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    };
    fetch('http://localhost:3000/sample', options).then(api_res => api_res.text()).then(res => {
      setData(d => {
        var nd = { ...d };
        nd.img = res;
        return nd;
      });
    });
  }
  var p = data.img ? {download: 'image.png'} : {};
  return <div className='container'>
    <div className='options'>
      <form onSubmit={(e) => tag === '' ? lfmGetAlbums(e) : lfmGetTag(e)}>
        <label>Username: </label>
        <input type='text' value={name} onChange={e => setName(e.target.value)} />
        <label> Tag Name: </label>
        <input type='text' value={tag} onChange={e => setTag(e.target.value)} />

        <label> Period: </label>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value='overall'>All-Time</option>
          <option value='12month'>1 Year</option>
          <option value='6month'>6 Months</option>
          <option value='3month'>3 Months</option>
          <option value='1month'>1 Month</option>
          <option value='7day'>7 Days</option>
        </select>

        <label> Max Size: </label>
        <select value={size} onChange={e => setSize(e.target.value)}>
          <option value={-1}>Automatic</option>
          <option value={2}>2x2</option>
          <option value={3}>3x3</option>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
        </select>
        <label> Make Chart Anonymous: </label>
        <input type='checkbox' checked={anonymous} onChange={e => setAnon(e.target.checked)} />
      </form>

      <div className='lfm-buttons'>
        <button onClick={lfmGetAlbums}>Make Top Albums Image</button>
        <button onClick={lfmGetTag}>Get Top Albums for Tag Image</button>
        <button onClick={lfmGetSample}>Get Sample Image</button>

        <a href={data.img} {...p}><button>Download Image</button></a>
      </div>
    </div>
    <div className='img-holder'>

      {data.img === '' ? null : <div>
        <img style={{ maxWidth: '80%', maxHeight: '80%' }} src={data.img} />
      </div>}
    </div>

  </div>;
}

export default App;