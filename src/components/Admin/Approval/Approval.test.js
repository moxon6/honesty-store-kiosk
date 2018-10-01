import {configure, shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Approval from './Approval';
import React from 'react';

import storeList from 'mockData/storeList.json';
import images from 'mockData/getImages.json';
import mockDataController from 'testUtils/mockDataController';
import {withDelay, fakeEvent} from 'testUtils/utils';

configure({adapter: new Adapter()});
jest.mock('../utils/DataController', () => jest.fn(() => mockDataController));

const mockImages = images.slice(0, 5);
const nextMockImages = images.slice(5, 8);
const initialState = {
  loading: false,
  image: mockImages[0],
  images: mockImages.slice(1),
  storeList
};
const afterClickState = {
  loading: false,
  image: images[1],
  images: images.slice(2, 8),
  storeList
};

describe('Approval', () => {
  let wrapper;

  beforeEach(done => {
    mockDataController.getStoreList.mockReturnValue(Promise.resolve(storeList));
    mockDataController.getImages.mockReturnValue(Promise.resolve(mockImages));
    mockDataController.trustImage.mockReset();
    mockDataController.deleteImage.mockReset();
    mockDataController.changeImageLabel.mockReset();
    wrapper = shallow(<Approval history={{}} />);
    withDelay().then(done);
  });

  it('should load store list and separate first and remaining images in initial state', () => {
    expect(wrapper.state()).toEqual(initialState);
  });

  it('should give image id to previewPane data-id attribute', () => {
    const {id} = mockImages[0];
    const previewPane = wrapper.find('.preview-pane');
    expect(previewPane.props()['data-id']).toBe(id);
  });

  it('should trust current image when trust button clicked, then load new images', done => {
    const {id} = mockImages[0];
    const trustButton = wrapper.find('.button-admin').at(1);
    expect(trustButton.text()).toBe('Trust');
    mockDataController.getImages.mockReturnValue(
      Promise.resolve(nextMockImages)
    );
    trustButton.simulate('click', fakeEvent(id));
    expect(mockDataController.deleteImage).not.toBeCalled();
    expect(mockDataController.trustImage).toBeCalledWith(id);
    withDelay().then(() => {
      expect(mockDataController.getImages).toBeCalledWith(
        false,
        3,
        mockImages[4].timestamp
      );
      expect(wrapper.state()).toEqual(afterClickState);
      done();
    });
  });

  it('should set current image as unknown when clicked, then load new images', done => {
    const {id} = mockImages[0];
    const trustButton = wrapper.find('.button-admin').at(2);
    expect(trustButton.text()).toBe('Unknown');
    mockDataController.getImages.mockReturnValue(
      Promise.resolve(nextMockImages)
    );
    trustButton.simulate('click', fakeEvent(id));
    expect(mockDataController.deleteImage).not.toBeCalled();
    expect(mockDataController.changeImageLabel).toBeCalledWith(id, 'unknown');
    expect(mockDataController.trustImage).toBeCalledWith(id);
    withDelay().then(() => {
      expect(mockDataController.getImages).toBeCalledWith(
        false,
        3,
        mockImages[4].timestamp
      );
      expect(wrapper.state()).toEqual(afterClickState);
      done();
    });
  });

  it('should delete current image when clicked, then load new images', done => {
    const {id} = mockImages[0];
    const deleteButton = wrapper.find('.button-admin').at(3);
    expect(deleteButton.text()).toBe('Delete');
    mockDataController.getImages.mockReturnValue(
      Promise.resolve(nextMockImages)
    );
    deleteButton.simulate('click', fakeEvent(id));
    expect(mockDataController.trustImage).not.toBeCalled();
    expect(mockDataController.deleteImage).toBeCalledWith(id);
    withDelay().then(() => {
      expect(mockDataController.getImages).toBeCalledWith(
        false,
        3,
        mockImages[4].timestamp
      );
      expect(wrapper.state()).toEqual(afterClickState);
      done();
    });
  });
});
