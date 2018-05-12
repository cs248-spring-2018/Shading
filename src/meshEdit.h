#ifndef CS248_MESHEDIT_H
#define CS248_MESHEDIT_H

#include "halfEdgeMesh.h"

using namespace std;

namespace CS248 {

class MeshResampler {
 public:
  MeshResampler(){};
  ~MeshResampler() {}

  void upsample(HalfedgeMesh& mesh);
  void downsample(HalfedgeMesh& mesh);
  void resample(HalfedgeMesh& mesh);
};

}  // namespace CS248

#endif  // CS248_MESHEDIT_H
