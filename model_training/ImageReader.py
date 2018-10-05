import tensorflow as tf
import collections
import os
import hashlib
import numpy as np
from tqdm import tqdm

class Config:
    MIN_NUM_IMAGES_PER_CLASS = 20
    MAX_NUM_IMAGES_PER_CLASS = 2 ** 27 - 1  # ~134M
    VALIDATION_PERCENTAGE = 10
    TESTING_PERCENTAGE = 10
    BOTTLENECK_DIR = 'tmp/bottleneck'

class Cache:
    ImageWrappers = {}

# TODO This should not be global
class Tensors:
    def __init__(self, sess, jpeg_data_tensor, decoded_image_tensor, resized_input_tensor, bottleneck_tensor):
        self.sess = sess
        self.jpeg_data_tensor = jpeg_data_tensor
        self.decoded_image_tensor = decoded_image_tensor
        self.resized_input_tensor = resized_input_tensor
        self.bottleneck_tensor = bottleneck_tensor

tensors = Tensors(None, None, None, None, None)
      
class ImageWrapper:
    def __init__(self, image_path, label):
        if not tf.gfile.Exists(image_path):
            raise Exception('File does not exist %s', image_path)
        self.image_path = image_path
        self.label = label

        self.bottleneck_values = None

    def get_bottleneck_values(self, bottleneck_dir, module_name):
        baseName = os.path.basename(self.image_path)
        bottleneck_path = os.path.join(Config.BOTTLENECK_DIR, baseName + '_' + module_name + '.txt')

        # If in Memory
        if self.bottleneck_values:
            return self.bottleneck_values
    
        # If on Disk
        elif os.path.exists(bottleneck_path):
            with open(bottleneck_path, 'r') as bottleneck_file:
                bottleneck_string = bottleneck_file.read()
            self.bottleneck_values = [float(x) for x in bottleneck_string.split(',')]
            return self.bottleneck_values

        # If neither in Memory or on Disk
        else:
            image_data = tf.gfile.FastGFile(self.image_path, 'rb').read()
            try:
              self.bottleneck_values = self.run_bottleneck_on_image(image_data)
            except Exception as e:
              raise RuntimeError('Error during processing file %s (%s)' % (self.image_path, str(e)))
            bottleneck_string = ','.join(str(x) for x in self.bottleneck_values)
            with open(bottleneck_path, 'w') as bottleneck_file:
              bottleneck_file.write(bottleneck_string)
            return self.bottleneck_values
      

    def run_bottleneck_on_image(self, image_data):
      resized_input_values = tensors.sess.run(tensors.decoded_image_tensor, {tensors.jpeg_data_tensor: image_data})
      bottleneck_values = tensors.sess.run(tensors.bottleneck_tensor, {tensors.resized_input_tensor: resized_input_values})
      return np.squeeze(bottleneck_values)

isValidation = lambda image : name_to_percentage(image) < Config.VALIDATION_PERCENTAGE
isTesting = lambda image : Config.VALIDATION_PERCENTAGE <= name_to_percentage(image) < Config.TESTING_PERCENTAGE
isTraining = lambda image: Config.TESTING_PERCENTAGE <= name_to_percentage(image)

class LabelReader:
    def __init__(self, directory, labelDir):
        self.label_path = os.path.join(directory, labelDir)
        self.label = labelDir
        if not tf.gfile.Exists(self.label_path):
          raise Exception("Image directory '" + self.label_path + "' not found.")
        images = os.listdir(self.label_path)
        if len(images) < Config.MIN_NUM_IMAGES_PER_CLASS:
            raise Exception("Folder has less than %d images" % Config.MIN_NUM_IMAGES_PER_CLASS)
        elif len(images) > Config.MAX_NUM_IMAGES_PER_CLASS:
            raise Exception("Folder has more than %d images" % Config.MAX_NUM_IMAGES_PER_CLASS)
        else:
            self.images = {
              'validation': [image for image in images if isValidation(image)],
              'testing' : [image for image in images if isTesting(image)],
              'training': [image for image in images if isTraining(image)]
            }

    def getImages(self, category):
        imagePaths = self.image_paths(category)
        for path in imagePaths:
            if path not in Cache.ImageWrappers:
                Cache.ImageWrappers[path] = ImageWrapper(path, self.label)
        return [Cache.ImageWrappers[path] for path in imagePaths]
    
    def image_paths(self, category):
        return [os.path.join(self.label_path, image) for image in self.images[category]]

    def training(self):
        return self.getImages('training')

    def testing(self):
        return self.getImages('testing')
      
    def validation(self):
        return self.getImages('validation')

def name_to_percentage(file_name):
    hash_name_hashed = hashlib.sha1(tf.compat.as_bytes(file_name)).hexdigest()
    return ((int(hash_name_hashed, 16) %
                        (Config.MAX_NUM_IMAGES_PER_CLASS + 1)) *
                        (100.0 / Config.MAX_NUM_IMAGES_PER_CLASS))

def main():
    directory = 'training_data'
    labelDirs = os.listdir(directory)
    for labelDir in tqdm(labelDirs):
        for imageWrapper in tqdm(LabelReader(directory, labelDir).training()):
            tqdm.write(imageWrapper.image_path)
            tqdm.write(imageWrapper.label)

if __name__ == "__main__":
    main()